const express = require("express");
const router = express.Router();
const ExpertSystem = require("../models/ExpertSystem");
const User = require("../models/User");
const Conversation = require("../models/Conversation"); 
const Lead = require("../models/Lead");
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

    // 1. Find user in database
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

    // 2. Prepare user identifiers
    const ownerPhone = user.phoneNumber || "+910000000000";
    const ownerUserId = firebaseUid;

    console.log(`User: ${user.fullName}, Phone: ${ownerPhone}, FirebaseUID: ${ownerUserId}`);

    // 3. Find or Create ExpertSystem
    let system = null;

    if (user.expertSystemID) {
      system = await ExpertSystem.findById(user.expertSystemID);
    }

    if (!system) {
      system = await ExpertSystem.findOne({
        $or: [
          { ownerPhone: ownerPhone },
          { ownerUserId: ownerUserId }
        ]
      });
    }

    let wasUpdated = false;
    let updateLog = [];

    if (!system) {
      // Create new ExpertSystem
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
      // Apply sync updates if needed
      const updates = {};

      if (system.ownerPhone !== ownerPhone) {
        updates.ownerPhone = ownerPhone;
        updateLog.push(`Updated phone from ${system.ownerPhone} to ${ownerPhone}`);
      }

      const preferredName = user.businessName || user.fullName;
      if (system.name === "My AI Assistant" && preferredName) {
        updates.name = preferredName;
        updateLog.push(`Updated name to "${preferredName}"`);
      }

      if (Object.keys(updates).length > 0) {
        system = await ExpertSystem.findByIdAndUpdate(
          system._id,
          { $set: updates },
          { new: true }
        );
        wasUpdated = true;
        console.log("✅ Updated existing ExpertSystem:", updateLog.join(", "));
      }
    }

    // Ensure User schema references this system ID
    if (!user.expertSystemID || user.expertSystemID.toString() !== system._id.toString()) {
      user.expertSystemID = system._id;
      await user.save();
    }

    const expertSystemId = system._id;
    console.log(`📊 Using ExpertSystem ID: ${expertSystemId}, Phone: ${system.ownerPhone}`);

    // 4. Gather Dashboard Stats (Real or Fallback Mock)
const today = new Date();
today.setHours(0, 0, 0, 0);

const yesterday24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

const [conversationStats, leadStats, recentMessages] = await Promise.all([

  Conversation.aggregate([
    {
      $match: {
        expertSystemID: expertSystemId
      }
    },
    {
      $facet: {
        totalConversations: [
          {
            $count: "count"
          }
        ],

        messagesToday: [
          {
            $unwind: "$messages"
          },
          {
            $match: {
              "messages.timestamp": {
                $gte: today
              }
            }
          },
          {
            $count: "count"
          }
        ],

        activeUsers24h: [
          {
            $match: {
              updatedAt: {
                $gte: yesterday24h
              }
            }
          },
          {
            $count: "count"
          }
        ]
      }
    }
  ]),

  Lead.aggregate([
    {
      $match: {
        expertSystemID: expertSystemId
      }
    },
    {
      $facet: {
        totalLeads: [
          {
            $count: "count"
          }
        ],

        converted: [
          {
            $match: {
              status: "Converted"
            }
          },
          {
            $count: "count"
          }
        ]
      }
    }
  ]),

  Conversation.aggregate([
    {
      $match: {
        expertSystemID: expertSystemId
      }
    },
    {
      $unwind: "$messages"
    },
    {
      $sort: {
        "messages.timestamp": -1
      }
    },
    {
      $limit: 5
    }
  ])
]);

const stats = {

  totalConversations:
    conversationStats[0]?.totalConversations[0]?.count || 0,

  messagesToday:
    conversationStats[0]?.messagesToday[0]?.count || 0,

  activeUsers24h:
    conversationStats[0]?.activeUsers24h[0]?.count || 0,

  totalLeads:
    leadStats[0]?.totalLeads[0]?.count || 0,

  convertedLeads:
    leadStats[0]?.converted[0]?.count || 0,

  faqHitRate: 0,

  gptFallbacks: 0
};

const activity = recentMessages.map(item => ({
  text: `${item.customerPhone}: ${item.messages.text}`,
  time: getTimeAgo(item.messages.timestamp)
}));

    // 5. Send Response
    res.json({
      success: true,
      system: {
        _id: system._id,
        name: system.name,
        fallbackType: system.fallbackType,
        ownerPhone: system.ownerPhone,
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

/**
 * Safely checks whether collections exist and can be queried.
 */
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

function getTimeAgo(date) {
  if (!date) return "recently";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

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

module.exports = router;