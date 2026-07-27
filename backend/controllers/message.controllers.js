import Lead from "../models/Lead.js";
import Conversation from "../models/Conversation.js";

export const handleInboundMessage = async (req, res) => {
  try {
    const { phone, name, messageText, detectedIntent, confidenceScore } = req.body;

    // 1. Update or create the Lead document matching your Lead schema
    const updatedLead = await Lead.findOneAndUpdate(
      { phone },
      {
        $setOnInsert: { 
          firstMessage: messageText,
          leadSource: "WhatsApp",
          createdAt: new Date()
        },
        $set: {
          name: name || undefined,
          lastActive: new Date(),
          status: "Engaged",
          lastIntent: detectedIntent,
          updatedAt: new Date()
        },
        $push: {
          intents: {
            intent: detectedIntent,
            confidence: confidenceScore,
            detectedAt: new Date()
          }
        }
      },
      { upsert: true, new: true }
    );

    // 2. Append to Conversation History
    await Conversation.findOneAndUpdate(
      { customerPhone: phone },
      {
        $push: { messages: { sender: "user", text: messageText, timestamp: new Date() } },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    // 3. Emit Real-Time Socket Event to Dashboard & Analytics UI
    const io = req.app.get("io");
    if (io) {
      io.emit("new_live_message", {
        id: updatedLead._id,
        text: `Message from ${name || phone}: "${messageText.substring(0, 40)}${messageText.length > 40 ? "..." : ""}"`,
        time: "Just now",
        type: "inbound",
        intent: detectedIntent
      });
    }

    return res.status(200).json({ success: true, lead: updatedLead });

  } catch (error) {
    console.error("💥 Webhook Inbound Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process message." });
  }
};