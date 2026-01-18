const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middlewares/auth");

// Endpoint: PUT /api/user/profile
// GET /api/user/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const firebaseUid = req.firebaseUser.uid;

    const user = await User.findOne({
      $or: [
        { firebaseUid },
        { email: req.firebaseUser.email }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      user: {
        name: user.fullName || "",
        businessName: user.businessName || "",
        email: user.email,
        country: user.country || "India",
        phone: user.phoneNumber || "",
        phoneVerified: user.phoneVerified || false
      }
    });
  } catch (error) {
    console.error("Fetch Profile Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});



module.exports = router;