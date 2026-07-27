const mongoose = require("mongoose");
const LeadRaw = require("../models/Lead");
const Lead = LeadRaw.default || LeadRaw;

const ConversationRaw = require("../models/Conversation");
const Conversation = ConversationRaw.default || ConversationRaw;

const getAnalyticsData = async (req, res) => {
  try {
    const rawSystemID = req.query.expertSystemID || req.user?.expertSystemID;

let matchFilter = {};

if (rawSystemID) {
    if (mongoose.Types.ObjectId.isValid(rawSystemID)) {
        const objectId = new mongoose.Types.ObjectId(rawSystemID);

        matchFilter = {
            $or: [
                { expertSystemID: objectId },
                { expertSystemID: rawSystemID }
            ]
        };
    } else {
        matchFilter = {
            expertSystemID: rawSystemID
        };
    }
}

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const past24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const past7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Run parallel aggregation pipelines safely
    const [leadStats, conversationStats, dailyMessageStats, confidenceStats] = await Promise.all([
      // 1. Lead Funnel & Tag Breakdown
      Lead.aggregate([
        { $match: matchFilter },
        {
          $facet: {
            statusCounts: [
              { $group: { _id: "$status", count: { $sum: 1 } } }
            ],
            tagCounts: [
              { $unwind: { path: "$tags", preserveNullAndEmptyArrays: true } },
              { $match: { tags: { $ne: null } } },
              { $group: { _id: "$tags", count: { $sum: 1 } } }
            ],
            active24h: [
              { $match: { lastActive: { $gte: past24Hours } } },
              { $count: "count" }
            ],
            totalLeads: [
              { $count: "count" }
            ]
          }
        }
      ]).catch(err => {
        console.error("Error in Lead.aggregate:", err);
        return [{}];
      }),

      // 2. Conversation & Message Totals
      Conversation.aggregate([
        { $match: matchFilter },
        {
          $facet: {
            totalConversations: [{ $count: "count" }],
            messagesToday: [
              { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
              { $match: { "messages.timestamp": { $gte: startOfToday } } },
              { $count: "count" }
            ]
          }
        }
      ]).catch(err => {
        console.error("Error in Conversation.aggregate:", err);
        return [{}];
      }),

      // 3. Messages Per Day (Last 7 Days)
      Conversation.aggregate([
        { $match: matchFilter },
        { $unwind: { path: "$messages", preserveNullAndEmptyArrays: true } },
        { $match: { "messages.timestamp": { $gte: past7Days } } },
        {
          $group: {
            _id: { $dayOfWeek: "$messages.timestamp" },
            messages: { $sum: 1 }
          }
        },
        { $sort: { "_id": 1 } }
      ]).catch(err => {
        console.error("Error in MessagesPerDay aggregate:", err);
        return [];
      }),

      // 4. AI Confidence Distribution
      Lead.aggregate([
        { $match: matchFilter },
        { $unwind: { path: "$intents", preserveNullAndEmptyArrays: true } },
        { $match: { "intents.confidence": { $ne: null } } },
        {
          $bucket: {
            groupBy: "$intents.confidence",
            boundaries: [0, 0.5, 0.7, 0.9, 1.01],
            default: "Unknown",
            output: { count: { $sum: 1 } }
          }
        }
      ]).catch(err => {
        console.error("Error in Confidence aggregate:", err);
        return [];
      })
    ]);

    // Process status map safely
    const rawStatuses = leadStats[0]?.statusCounts || [];
    const statusMap = rawStatuses.reduce((acc, curr) => {
      if (curr._id) acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Process tag map safely
    const rawTags = leadStats[0]?.tagCounts || [];
    const tagMap = rawTags.reduce((acc, curr) => {
      if (curr._id) acc[curr._id] = curr.count;
      return acc;
    }, {});

    // Days mapping
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const messagesPerDay = (dailyMessageStats || []).map((item) => ({
      day: dayNames[(item._id || 1) - 1] || "Day",
      messages: item.messages || 0
    }));

    // Confidence ranges mapping
    const confidenceRangeLabels = {
      0: "<50%",
      0.5: "50-69%",
      0.7: "70-89%",
      0.9: "90-100%"
    };

    const confidenceData = (confidenceStats || []).map((item) => ({
      range: confidenceRangeLabels[item._id] || "Other",
      count: item.count || 0
    }));

    return res.status(200).json({
      success: true,
      kpis: {
        totalConversations: conversationStats[0]?.totalConversations[0]?.count || 0,
        messagesToday: conversationStats[0]?.messagesToday[0]?.count || 0,
        activeCustomers: leadStats[0]?.active24h[0]?.count || 0,
        totalLeads: leadStats[0]?.totalLeads[0]?.count || 0,
        openLeads: statusMap["New"] || 0,
        engagedLeads: statusMap["Engaged"] || 0,
        convertedLeads: statusMap["Converted"] || 0,
        interestedLeads: tagMap["Interested"] || 0,
        hotLeads: tagMap["Hot lead"] || 0
      },
      charts: {
        messagesPerDay,
        confidenceData
      }
    });

  } catch (error) {
    console.error("💥 Server crash prevented in getAnalyticsData:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
};

module.exports = { getAnalyticsData };