const express = require("express");
const router = express.Router();
const ExpertSystem = require("../models/ExpertSystem");
const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Lead = require("../models/Lead");
const Activity = require("../models/Activity");
const authMiddleware = require("../middlewares/auth");

router.get("/me", authMiddleware, async (req, res) => {
  try {
    if (!req.firebaseUser) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const firebaseUid = req.firebaseUser.uid;
    const firebaseEmail = req.firebaseUser.email;

    // 1. Find the user in your User database
    const user = await User.findOne({
      $or: [
        { firebaseUid: firebaseUid },
        { email: firebaseEmail }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found in database"
      });
    }

    // 2. Get phone number from User database
    const ownerPhone = user.phoneNumber || "+910000000000";
    const ownerUserId = firebaseUid;
    
    console.log(`User: ${user.fullName}, Phone: ${ownerPhone}, FirebaseUID: ${ownerUserId}`);

    // 3. Find or create ExpertSystem - with UPDATE capability
    let system = await ExpertSystem.findOne({
      $or: [
        { ownerPhone: ownerPhone },
        { ownerUserId: ownerUserId }
      ]
    });

    let wasUpdated = false;
    let updateLog = [];
    
    if (!system) {
      // Create new system
      system = await ExpertSystem.create({
        ownerUserId: ownerUserId,
        ownerPhone: ownerPhone,
        name: user.businessName || user.fullName || "My AI Assistant",
        domain: "general",
        fallbackType: "gpt"
      });
      updateLog.push("Created new ExpertSystem");
      console.log("✅ Created new ExpertSystem");
    } else {
      // Check and apply updates if needed
      const updates = {};
      
      // Update phone if it's wrong
      if (system.ownerPhone !== ownerPhone) {
        updates.ownerPhone = ownerPhone;
        updateLog.push(`Updated phone from ${system.ownerPhone} to ${ownerPhone}`);
      }
      
      // Update name if it's still default
      const preferredName = user.businessName || user.fullName;
      if (system.name === "My AI Assistant" && preferredName) {
        updates.name = preferredName;
        updateLog.push(`Updated name to "${preferredName}"`);
      }
      
      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        system = await ExpertSystem.findByIdAndUpdate(
          system._id,
          { $set: updates },
          { new: true } // Return updated document
        );
        wasUpdated = true;
        console.log("✅ Updated existing ExpertSystem:", updateLog.join(", "));
      }
    }

    const expertSystemId = system._id;
    console.log(`📊 Using ExpertSystem ID: ${expertSystemId}, Phone: ${system.ownerPhone}`);

    // 4. Get dashboard stats (with fallback to mock data)
    let stats = {};
    let activity = [];

    try {
      // Try to get dynamic stats if models exist
      const modelsExist = await checkModelsExist();
      
      if (modelsExist) {
        // Calculate REAL dynamic stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yesterday24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const [
          totalConversations,
          totalLeads,
          messagesToday,
          faqAnswers,
          gptFallbacks,
          activeUsers24h
        ] = await Promise.all([
          Conversation.countDocuments({ expertSystemId }),
          Lead.countDocuments({ expertSystemId }),
          Message.countDocuments({
            expertSystemId,
            timestamp: { $gte: today, $lt: tomorrow }
          }),
          Message.countDocuments({
            expertSystemId,
            responseType: 'faq',
            timestamp: { $gte: today, $lt: tomorrow }
          }),
          Message.countDocuments({
            expertSystemId,
            responseType: 'gpt',
            timestamp: { $gte: today, $lt: tomorrow }
          }),
          Conversation.countDocuments({
            expertSystemId,
            lastMessageTime: { $gte: yesterday24h }
          })
        ]);

        // Calculate FAQ Hit Rate
        const totalAnswersToday = faqAnswers + gptFallbacks;
        const faqHitRate = totalAnswersToday > 0
          ? Math.round((faqAnswers / totalAnswersToday) * 100)
          : 0;

        stats = {
          totalConversations,
          totalLeads,
          messagesToday,
          faqHitRate,
          gptFallbacks,
          activeUsers24h,
          dataSource: "real"
        };

        // Get recent activities
        const recentActivities = await Activity.find({
          expertSystemId
        })
          .sort({ timestamp: -1 })
          .limit(5)
          .lean();

        activity = recentActivities.map(act => ({
          text: formatActivityText(act.type, act.description),
          time: getTimeAgo(act.timestamp)
        }));

        console.log("📈 Using real dashboard data");

      } else {
        // Use mock data if models don't exist
        stats = generateMockStats();
        activity = generateMockActivity();
        console.log("🔄 Using mock dashboard data (models not found)");
      }

    } catch (err) {
      // Fallback to mock data on error
      console.log("⚠️ Error calculating stats, using mock data:", err.message);
      stats = generateMockStats();
      activity = generateMockActivity();
    }

    // 5. Prepare and send response
    res.json({
      success: true,
      system: {
        _id: system._id,
        name: system.name,
        fallbackType: system.fallbackType,
        ownerPhone: system.ownerPhone, // This should now be correct
        domain: system.domain,
        ownerUserId: system.ownerUserId,
        updated: wasUpdated,
        updateLog: updateLog.length > 0 ? updateLog : undefined
      },
      user: {
        name: user.fullName || "",
        businessName: user.businessName || "",
        email: user.email,
        phone: user.phoneNumber || ""
      },
      stats,
      activity,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error("❌ ExpertSystem error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
});

// Helper function to check if models exist in database
async function checkModelsExist() {
  try {
    // Try to count documents in each collection
    // If collections don't exist, this will throw an error
    await Promise.all([
      Conversation.countDocuments({}).limit(1),
      Message.countDocuments({}).limit(1),
      Lead.countDocuments({}).limit(1),
      Activity.countDocuments({}).limit(1)
    ]);
    return true;
  } catch (err) {
    console.log("Models check failed:", err.message);
    return false;
  }
}

// Helper function to format activity text
function formatActivityText(type, description) {
  const activityMap = {
    'new_conversation': 'New conversation started',
    'new_lead': 'New lead captured',
    'faq_answered': 'FAQ answered automatically',
    'gpt_fallback': 'GPT fallback used',
    'upsell_suggested': 'Upsell suggestion sent',
    'bot_paused': 'Bot was paused',
    'bot_resumed': 'Bot was resumed'
  };
  return description || activityMap[type] || 'System activity';
}

// Helper function for time ago
function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";

  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";

  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";

  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";

  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";

  return Math.floor(seconds) + "s ago";
}

// Generate mock stats for development
function generateMockStats() {
  // Generate random but realistic data
  const baseConversations = Math.floor(Math.random() * 50) + 10;
  const baseLeads = Math.floor(baseConversations * 0.3);
  const messagesToday = Math.floor(Math.random() * 100) + 20;
  const faqHitRate = Math.floor(Math.random() * 40) + 60; // 60-100%
  const gptFallbacks = Math.floor(messagesToday * (1 - faqHitRate / 100));
  const activeUsers24h = Math.floor(Math.random() * 30) + 5;

  return {
    totalConversations: baseConversations,
    totalLeads: baseLeads,
    messagesToday: messagesToday,
    faqHitRate: faqHitRate,
    gptFallbacks: gptFallbacks,
    activeUsers24h: activeUsers24h,
    dataSource: "mock"
  };
}

// Generate mock activity for development
function generateMockActivity() {
  const activities = [
    { type: 'new_conversation', text: 'New conversation started' },
    { type: 'new_lead', text: 'New lead captured from WhatsApp' },
    { type: 'faq_answered', text: 'FAQ answered automatically' },
    { type: 'gpt_fallback', text: 'GPT fallback used for complex query' },
    { type: 'upsell_suggested', text: 'Upsell suggestion sent' }
  ];

  const times = ['2m ago', '15m ago', '1h ago', '3h ago', '5h ago'];

  return activities.map((act, index) => ({
    text: act.text,
    time: times[index] || 'recently'
  }));
}

module.exports = router;