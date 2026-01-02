const { sendWhatsAppMessage } = require("../services/whatsapp.services");
const { appendLeadToSheet } = require("../utils/googleSheet");
const User = require("../models/User"); ; 

async function handleIncomingMessage(req, res) {
  try {
    const from = req.body.From; // whatsapp:+91XXXXXXXXXX
    const message = req.body.Body;
    const profileName = req.body.ProfileName || "Unknown";
    const to = from;
    const phone = from.replace("whatsapp:", "");

    // 🔹 TEMP: static reply (until GPT works)
    const replyText = "Hi! Thanks for messaging. We’ll get back to you soon 😊";
    const existingUser = await User.findOne({ phone });

    if (!existingUser) {
      await User.create({
        profileName,
        phone,
        firstMessage: message,
      });
    }

    console.log("added to MOngoDB")
    // 🔹 Save lead to Google Sheets
    await appendLeadToSheet({
      name: profileName,
      phone,
      message,
      timestamp: new Date().toISOString(),
    });

    // 🔹 Send reply back to WhatsApp
    await sendWhatsAppMessage(to, replyText);
    console.log('✅ “WhatsApp reply received successfully”'); 

    // Twilio requires fast 200 OK
    res.status(200).send("OK");
  } catch (error) {
    console.error("WhatsApp Controller Error:", error.message);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = {
  handleIncomingMessage,
};
