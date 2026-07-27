// expertSystem.controller.js
const Message = require("../models/Message");
const Lead = require("../models/Lead");
const Conversation = require("../models/Conversation");
const ExpertSystem = require("../models/ExpertSystem"); // Or your System model

// controllers/expertSystem.controller.js

exports.getMyExpertSystem = async (req, res) => {
  try {
    const systemID = req.query.expertSystemID || req.user?.expertSystemID;

    let system = await ExpertSystem.findOne({
      $or: [
        { _id: systemID },
        { ownerUserId: req.user?._id }
      ]
    });

    if (!system) {
      return res.status(404).json({ success: false, message: "System not found" });
    }

    // Calculate live stats using the matched system._id
    const stats = await getSystemStats(system._id);
    const activity = await getRecentActivity(system._id);

    res.json({
      success: true,
      system,
      stats,
      activity
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


exports.getOverviewData = async (req, res) => {
  try {
    const userId = req.user?._id;

    // Define "Start of Today" in local time
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Run queries concurrently for speed
    const [
      totalConversations,
      totalLeads,
      messagesToday,
      totalMessages,
      faqMessagesCount,
      gptFallbacksCount,
      recentMessages
    ] = await Promise.all([
      // Total Conversations
      Conversation.countDocuments(userId ? { expertSystemID: userId } : {}),

      // Total Leads
      Lead.countDocuments(userId ? { expertSystemID: userId } : {}),

      // Messages sent today
      Message.countDocuments({
        createdAt: { $gte: startOfToday }
      }),

      // Total Messages overall (used for FAQ hit rate)
      Message.countDocuments({}),

      // FAQ Hits
      Message.countDocuments({ messageType: "faq-response" }),

      // GPT Fallbacks
      Message.countDocuments({ messageType: "gpt-response" }),

      // Recent Activity Feed
      Message.find({})
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("leadId", "name phone")
        .lean()
    ]);

    // Calculate FAQ Hit Rate %
    const faqHitRate = totalMessages > 0 
      ? Math.round((faqMessagesCount / totalMessages) * 100) 
      : 0;

    // Format Activity for Frontend
    const activity = recentMessages.map((msg) => {
      const senderName = msg.leadId?.name || msg.leadId?.phone || msg.sender || "User";
      return {
        text: `${senderName}: ${msg.text || "Sent a message"}`,
        time: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recently"
      };
    });

    // Fetch System Profile Info
    const system = await ExpertSystem.findOne({ userId }).lean() || {
      name: req.user?.name || "Expert",
      fallbackType: "gpt",
      ownerPhone: "Connected"
    };

    return res.status(200).json({
      success: true,
      system,
      stats: {
        totalConversations,
        totalLeads,
        messagesToday,
        faqHitRate,
        gptFallbacks: gptFallbacksCount,
        activeUsers24h: totalLeads // or calculate active distinct leadIds in 24h
      },
      activity
    });

  } catch (error) {
    console.error("Error fetching overview data:", error);
    return res.status(500).json({
      success: false,
      message: "Error retrieving dashboard metrics",
      error: error.message
    });
  }
};