const twilio = require("twilio");

const client = twilio(
  process.env.TWILIO_SID,
  process.env.TWILIO_SECRET
);

const FROM_WHATSAPP_NUMBER = process.env.TWILIO_PHONE_NUMBER ;

async function sendWhatsAppMessage(to, body) {
  return client.messages.create({
    from: FROM_WHATSAPP_NUMBER, // e.g. "whatsapp:+14155238886"
    to: to,
    body,
  });
}

module.exports = {
  sendWhatsAppMessage,
};
