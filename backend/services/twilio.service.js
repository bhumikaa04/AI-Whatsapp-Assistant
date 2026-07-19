require('dotenv').config();
const client = require("../config/twilio");

class TwilioService {

    async sendOTP(phoneNumber) {
        return await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({
                to: phoneNumber,
                channel: "sms"
            });
    } // Closes sendOTP

    async verifyOTP(phoneNumber, code) {
        return await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({
                to: phoneNumber,
                code
            });
    } // Closes verifyOTP

} // Closes TwilioService class

module.exports = new TwilioService();