const User = require("../models/User");
const twilioService = require("../services/twilio.service");

exports.sendOtp = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }
        // Find current user
        const currentUser = await User.findOne({
            firebaseUid: req.firebaseUser.uid
        });
        if (!currentUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Check if another verified user already owns this phone
        const existingUser = await User.findOne({
            phoneNumber,
            phoneVerified: true,
            _id: { $ne: currentUser._id }
        });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Phone number already in use."
            });
        }
        await twilioService.sendOTP(phoneNumber);
        res.json({
            success: true,
            message: "OTP sent successfully."
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }

};
exports.verifyOtp = async (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;
        const result = await twilioService.verifyOTP(phoneNumber, otp);
        
        if (result.status !== "approved") {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        // 💡 CRITICAL FIX: Match user records against email if firebaseUid is missing from MongoDB
        const userEmail = req.firebaseUser?.email; 

        console.log(userEmail); 
        
        const user = await User.findOne({ email: userEmail });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found with this authentication session"
            });
        }

        user.phoneNumber = phoneNumber;
        user.phoneVerified = true;
        user.phoneVerifiedAt = new Date();
        await user.save();

        res.json({
            success: true,
            message: "Phone verified successfully",
            phoneVerified: true // Send state context back cleanly
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
