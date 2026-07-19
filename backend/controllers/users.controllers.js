//user.controllers.js

const User = require("../models/User");
// user.controllers.js
exports.updateProfile = async (req, res) => {
  try {
    const { name, businessName, country, phoneNumber } = req.body;
    const firebaseUid = req.firebaseUser.uid; 

    // Find user first to preserve existing states
    const existingUser = await User.findOne({ firebaseUid });
    if (!existingUser) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    // Only update explicit profile details
    existingUser.fullName = name || existingUser.fullName;
    existingUser.businessName = businessName || existingUser.businessName;
    existingUser.country = country || existingUser.country;
    if (phoneNumber) existingUser.phoneNumber = phoneNumber;

    const updatedUser = await existingUser.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        businessName: updatedUser.businessName,
        phoneNumber: updatedUser.phoneNumber,
        phoneVerified: updatedUser.phoneVerified,
        expertSystemID: updatedUser.expertSystemID // 💡 PRESERVED KEEPING COMPLETION VALID
      }
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};