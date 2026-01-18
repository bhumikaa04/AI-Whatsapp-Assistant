// server/services/twilio.service.js
require("dotenv").config();
const twilio = require("twilio");

class TwilioService {
  constructor() {
    // Note: Use TWILIO_SID and TWILIO_AUTH_TOKEN (usually called Auth Token, not Secret)
    this.client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_SECRET || process.env.TWILIO_AUTH_TOKEN
    );
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  /**
   * Generates a 6-digit OTP
   * Matches call in controller: twilioService.generateOTP()
   */
  generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Formats phone number to E.164 standard
   * Matches call in controller: twilioService.formatPhoneNumber(phoneNumber)
   */
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return null;
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    // Ensure it starts with '+'
    return `+${cleaned}`;
  }

  /**
   * Sends OTP via SMS
   * Matches call in controller: twilioService.sendSMS(formattedPhone, otp)
   */
  async sendSMS(phoneNumber, otp) {
    try {
      const message = await this.client.messages.create({
        body: `Your Replyly verification code is: ${otp}. Valid for 5 minutes.`,
        from: this.fromNumber,
        to: phoneNumber,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error("Twilio SMS error:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sends OTP via WhatsApp
   * Matches call in controller: twilioService.sendWhatsApp(formattedPhone, otp)
   */
  async sendWhatsApp(phoneNumber, otp) {
    try {
      // Ensure phone number has correct WhatsApp prefix
      const whatsappTo = phoneNumber.startsWith('whatsapp:') 
        ? phoneNumber 
        : `whatsapp:${phoneNumber}`;
      
      const whatsappFrom = this.fromNumber.startsWith('whatsapp:')
        ? this.fromNumber
        : `whatsapp:${this.fromNumber}`;

      const message = await this.client.messages.create({
        body: `Your Replyly verification code is: ${otp}. Valid for 5 minutes.`,
        from: whatsappFrom,
        to: whatsappTo,
      });

      return {
        success: true,
        messageId: message.sid,
      };
    } catch (error) {
      console.error("Twilio WhatsApp error:", error.message);
      return { success: false, error: error.message };
    }
  }
}

// Export a single instance of the class
module.exports = new TwilioService();