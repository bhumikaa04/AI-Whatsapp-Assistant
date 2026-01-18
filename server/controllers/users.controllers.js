const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  try {
    const { name, businessName, country, phoneNumber, phoneVerified } = req.body;
    
    // Extracted from your authMiddleware (decoded Firebase token)
    const firebaseUid = req.firebaseUser.uid; 

    // Find user by firebaseUid and update their profile fields
    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid },
      { 
        fullName: name,
        businessName,
        country,
        phoneNumber,
        // Since verification is now optional, we save the status sent by the frontend
        phoneVerified: phoneVerified || false 
      },
      { 
        new: true,           // Return the updated document
        runValidators: true, // Ensure the data matches your Schema rules
        upsert: false        // Don't create a new user if one doesn't exist
      }
    );

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false, 
        message: "User account not found" 
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        fullName: updatedUser.fullName,
        businessName: updatedUser.businessName,
        phoneNumber: updatedUser.phoneNumber,
        phoneVerified: updatedUser.phoneVerified
      }
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error while saving profile" 
    });
  }
};