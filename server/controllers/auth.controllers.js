const User = require("../models/User");
const Otp = require("../models/Otp");
const twilioService = require("../services/twilio.service");

// 1. SYNC USER
exports.syncUser = async (req, res) => {
  try {
    const { uid, email, name, photo } = req.firebaseUser;

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        firebaseUid: uid,
        fullName: name || "User",
        email,
        profilePhoto: photo,
        authProvider: "google",
      });
    }

    const isProfileComplete = 
      user.phoneVerified === true && 
      user.expertSystemID;

    res.json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        phoneVerified: user.phoneVerified,
        expertSystemID: user.expertSystemID,
      },
      isProfileComplete,
    });
  } catch (error) {
    console.error("Sync error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
};

// 2. SEND OTP (with Twilio)
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber, channel = 'sms' } = req.body;
    // Extract Firebase UID from the verified token
    const firebaseUid = req.firebaseUser?.uid;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    // Find the user in MongoDB using the Firebase UID string
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please sync your account."
      });
    }

    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    // Check if phone already verified by another user
    const existingUser = await User.findOne({ 
      phoneNumber: formattedPhone, 
      phoneVerified: true,
      _id: { $ne: user._id } // Compare using MongoDB ObjectId
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "This phone number is already registered"
      });
    }

    await Otp.deleteMany({ phoneNumber: formattedPhone });

    const otp = twilioService.generateOTP();

    // Save OTP linked to the MongoDB user._id
    await Otp.create({
      phoneNumber: formattedPhone,
      otp,
      userId: user._id, 
    });

    let result;
    if (channel === 'whatsapp') {
      result = await twilioService.sendWhatsApp(formattedPhone, otp);
    } else {
      result = await twilioService.sendSMS(formattedPhone, otp);
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to send OTP");
    }

    res.json({
      success: true,
      message: `OTP sent successfully via ${channel}`,
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error("Send OTP error:", error.message);
    
    if (error.message.includes('not a valid phone number')) {
      return res.status(400).json({
        success: false,
        message: "Invalid phone number format"
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to send OTP"
    });
  }
};

// 3. VERIFY OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    const firebaseUid = req.firebaseUser?.uid;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: "Phone number and OTP are required"
      });
    }

    // Find user record first
    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    const otpRecord = await Otp.findOne({
      phoneNumber: formattedPhone,
      otp,
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP"
      });
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "OTP has expired"
      });
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({
        success: false,
        message: "Too many attempts. Please request a new OTP"
      });
    }

    otpRecord.attempts += 1;
    await otpRecord.save();

    if (otpRecord.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Incorrect OTP"
      });
    }

    // Update user's phone verification using the correct MongoDB _id
    await User.findByIdAndUpdate(user._id, {
      phoneNumber: formattedPhone,
      phoneVerified: true,
      phoneVerifiedAt: new Date(),
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    res.json({
      success: true,
      message: "Phone number verified successfully",
      phoneNumber: formattedPhone,
      verified: true,
    });

  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP"
    });
  }
};

// 4. RESEND OTP
exports.resendOtp = async (req, res) => {
  try {
    const { phoneNumber, channel = 'sms' } = req.body;
    const firebaseUid = req.firebaseUser?.uid;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required"
      });
    }

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const formattedPhone = twilioService.formatPhoneNumber(phoneNumber);

    const lastOtp = await Otp.findOne({ 
      phoneNumber: formattedPhone 
    }).sort({ createdAt: -1 });

    if (lastOtp) {
      const timeSinceLast = Date.now() - lastOtp.createdAt.getTime();
      const minTime = 30 * 1000; 

      if (timeSinceLast < minTime) {
        const waitTime = Math.ceil((minTime - timeSinceLast) / 1000);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting new OTP`
        });
      }
    }

    await Otp.deleteMany({ phoneNumber: formattedPhone });

    const otp = twilioService.generateOTP();

    await Otp.create({
      phoneNumber: formattedPhone,
      otp,
      userId: user._id,
    });

    let result;
    if (channel === 'whatsapp') {
      result = await twilioService.sendWhatsApp(formattedPhone, otp);
    } else {
      result = await twilioService.sendSMS(formattedPhone, otp);
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to resend OTP");
    }

    res.json({
      success: true,
      message: `OTP resent successfully via ${channel}`,
      ...(process.env.NODE_ENV === 'development' && { otp })
    });

  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to resend OTP"
    });
  }
};