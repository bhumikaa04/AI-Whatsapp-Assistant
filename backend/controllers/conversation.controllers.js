const Conversation = require("../models/Conversation");
const Customer = require("../models/Customer");
const mongoose = require("mongoose");

/**
 * 1. Fetches all conversations merged with customer metrics for the dashboard list view
 */
async function getAllConversations(req, res) {
  try {
    const { expertSystemID } = req.query;
    console.log(`🔍 [Dashboard API] Fetching conversations. Query expertSystemID: ${expertSystemID}`);

    // Build match stage if expertSystemID is provided
    const matchStage = {};
    if (expertSystemID) {
      // Cast to ObjectId if stored as ObjectId, otherwise match raw string
      matchStage.expertSystemID = mongoose.Types.ObjectId.isValid(expertSystemID)
        ? new mongoose.Types.ObjectId(expertSystemID)
        : expertSystemID;
    }

    const pipeline = await Conversation.aggregate([
      // Stage 0: Filter by user/expert system if provided
      { $match: matchStage },

      // Stage 1: Safely normalize phone string
      {
        $addFields: {
          cleanedConvPhone: {
            $replaceAll: {
              input: { $ifNull: ["$customerPhone", ""] },
              find: "+",
              replacement: ""
            }
          }
        }
      },

      // Stage 2: Join with customers collection
      {
        $lookup: {
          from: "customers",
          let: { convPhone: "$cleanedConvPhone", expertId: "$expertSystemID" },
          pipeline: [
            {
              $addFields: {
                cleanedCustPhone: {
                  $replaceAll: {
                    input: { $ifNull: ["$phone", ""] },
                    find: "+",
                    replacement: ""
                  }
                }
              }
            },
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$cleanedCustPhone", "$$convPhone"] },
                    { $eq: ["$expertSystemID", "$$expertId"] }
                  ]
                }
              }
            }
          ],
          as: "customerProfile"
        }
      },
      {
        $unwind: {
          path: "$customerProfile",
          preserveNullAndEmptyArrays: true
        }
      },

      // Stage 3: Map output cleanly for frontend component
      {
        $project: {
          _id: 1,
          customerPhone: 1,
          expertSystemID: 1,
          messages: 1,
          intent: { $ifNull: ["$customerProfile.intent", "New Lead"] },
          totalMessages: {
            $ifNull: [
              "$customerProfile.totalMessages",
              { $size: { $ifNull: ["$messages", []] } }
            ]
          },
          lastInteraction: { $ifNull: ["$customerProfile.lastInteraction", "$updatedAt"] },
          name: { $ifNull: ["$customerProfile.name", "Anonymous Prospect"] },
          avatarSeed: { $ifNull: ["$customerProfile.avatarSeed", 0] }
        }
      },
      { $sort: { lastInteraction: -1 } }
    ]);

    console.log(`✅ [Dashboard API] Pipeline completed. Total retrieved: ${pipeline.length}`);
    return res.status(200).json(pipeline);
  } catch (error) {
    console.error("💥 Error aggregating dashboard conversations:", error);
    return res.status(500).json({ error: "Failed to load pipeline records." });
  }
}

/**
 * 2. Fetches a specific conversation and its detailed customer information
 */
async function getConversationById(req, res) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid Conversation ID is required." });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found." });
    }

    const cleanedPhone = (conversation.customerPhone || "").replace(/^\+/, "");

    // Search customer with phone matching and matching tenant ID
    const customer = await Customer.findOne({
      expertSystemID: conversation.expertSystemID,
      $or: [
        { phone: conversation.customerPhone },
        { phone: cleanedPhone },
        { phone: `+${cleanedPhone}` }
      ]
    });

    const detailedConversation = {
      ...conversation.toObject(),
      customerProfile: customer || null,
      metrics: {
        totalMessages: customer?.totalMessages || conversation.messages?.length || 0,
        lastInteraction: customer?.lastInteraction || conversation.updatedAt,
        intent: customer?.intent || "New Lead",
        name: customer?.name || "Anonymous Prospect"
      }
    };

    return res.status(200).json(detailedConversation);
  } catch (error) {
    console.error("💥 Error fetching conversation details:", error);
    return res.status(500).json({ error: "Failed to load conversation details." });
  }
}

/**
 * 3. Handles manual response overrides submitted straight from your web CRM console
 */
async function sendManualReply(req, res) {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Reply body content cannot be empty." });
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      return res.status(404).json({ error: "Target conversation channel missing." });
    }

    const adminMessageObj = {
      sender: "bot",
      text: text.trim(),
      timestamp: new Date()
    };

    conversation.messages.push(adminMessageObj);
    await conversation.save();

    // Update customer stats
    const cleanedPhone = conversation.customerPhone.replace(/^\+/, "");
    await Customer.findOneAndUpdate(
      {
        expertSystemID: conversation.expertSystemID,
        $or: [{ phone: conversation.customerPhone }, { phone: cleanedPhone }]
      },
      {
        $inc: { totalMessages: 1 },
        $set: { lastInteraction: new Date() }
      },
      { upsert: false }
    );

    return res.status(201).json(adminMessageObj);
  } catch (error) {
    console.error("💥 Manual response registration failed:", error);
    return res.status(500).json({ error: "Failed to process outbound message payload." });
  }
}

module.exports = {
  getAllConversations,
  getConversationById,
  sendManualReply
};