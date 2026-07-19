// server/controllers/businessProfile.controller.js
const BusinessProfile = require("../models/BusinessProfile");

/**
 * GET /api/business-profile
 * Fetches the business profile for the active expert system
 */
exports.getProfile = async (req, res) => {
  try {
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    console.log(`🔍 [Business Profile] Fetching profile for expertSystemID: ${expertSystemID}`);

    const profile = await BusinessProfile.findOne({ expertSystemID });

    if (!profile) {
      return res.status(404).json({ 
        error: "Business profile not found for this expert system." 
      });
    }

    return res.status(200).json(profile);
  } catch (error) {
    console.error("❌ Error fetching business profile:", error);
    return res.status(500).json({ 
      error: "Failed to retrieve business profile." 
    });
  }
};

/**
 * POST /api/business-profile
 * Creates or updates the business profile
 */
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { 
      expertSystemID,
      businessName,
      businessDescription,
      products,
      services,
      policies,
      additionalInstructions,
      tone,
      language
    } = req.body;

    // Validate required fields
    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    if (!businessName || businessName.trim() === "") {
      return res.status(400).json({ 
        error: "Business name is required." 
      });
    }

    console.log(`🔍 [Business Profile] Creating/Updating profile for expertSystemID: ${expertSystemID}`);

    // Check if profile exists
    const existingProfile = await BusinessProfile.findOne({ expertSystemID });

    // Prepare update data
    const updateData = {
      businessName: businessName.trim(),
      businessDescription: businessDescription?.trim() || "",
      products: products || [],
      services: services || [],
      policies: policies || [],
      additionalInstructions: additionalInstructions?.trim() || "",
      tone: tone || "Professional",
      language: language || "English"
    };

    let profile;

    if (existingProfile) {
      // Update existing profile
      profile = await BusinessProfile.findOneAndUpdate(
        { expertSystemID },
        updateData,
        { new: true, runValidators: true }
      );
      console.log(`✅ [Business Profile] Updated profile for expertSystemID: ${expertSystemID}`);
    } else {
      // Create new profile
      profile = await BusinessProfile.create({
        expertSystemID,
        ...updateData
      });
      console.log(`✅ [Business Profile] Created new profile for expertSystemID: ${expertSystemID}`);
    }

    return res.status(200).json({
      success: true,
      message: existingProfile ? "Business profile updated successfully." : "Business profile created successfully.",
      data: profile
    });

  } catch (error) {
    console.error("❌ Error saving business profile:", error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({ 
        error: "A business profile already exists for this expert system." 
      });
    }

    return res.status(500).json({ 
      error: "Failed to save business profile." 
    });
  }
};

/**
 * PUT /api/business-profile
 * Alias for createOrUpdateProfile (for consistency)
 */
exports.updateProfile = async (req, res) => {
  // Reuse the same logic
  return exports.createOrUpdateProfile(req, res);
};

/**
 * DELETE /api/business-profile
 * Deletes the business profile
 */
exports.deleteProfile = async (req, res) => {
  try {
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID || req.body.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    console.log(`🗑️ [Business Profile] Deleting profile for expertSystemID: ${expertSystemID}`);

    const profile = await BusinessProfile.findOneAndDelete({ expertSystemID });

    if (!profile) {
      return res.status(404).json({ 
        error: "Business profile not found." 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Business profile deleted successfully."
    });

  } catch (error) {
    console.error("❌ Error deleting business profile:", error);
    return res.status(500).json({ 
      error: "Failed to delete business profile." 
    });
  }
};

/**
 * GET /api/business-profile/check
 * Checks if a profile exists
 */
exports.checkProfileExists = async (req, res) => {
  try {
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    const profile = await BusinessProfile.findOne({ expertSystemID });

    return res.status(200).json({
      exists: !!profile,
      profile: profile || null
    });

  } catch (error) {
    console.error("❌ Error checking business profile:", error);
    return res.status(500).json({ 
      error: "Failed to check business profile." 
    });
  }
};

/**
 * PATCH /api/business-profile/tone
 * Updates only the tone setting
 */
exports.updateTone = async (req, res) => {
  try {
    const { tone } = req.body;
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    if (!tone) {
      return res.status(400).json({ 
        error: "Tone is required." 
      });
    }

    const profile = await BusinessProfile.findOneAndUpdate(
      { expertSystemID },
      { tone },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ 
        error: "Business profile not found." 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tone updated successfully.",
      data: profile
    });

  } catch (error) {
    console.error("❌ Error updating tone:", error);
    return res.status(500).json({ 
      error: "Failed to update tone." 
    });
  }
};

/**
 * PATCH /api/business-profile/language
 * Updates only the language setting
 */
exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

    if (!language) {
      return res.status(400).json({ 
        error: "Language is required." 
      });
    }

    const profile = await BusinessProfile.findOneAndUpdate(
      { expertSystemID },
      { language },
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({ 
        error: "Business profile not found." 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language updated successfully.",
      data: profile
    });

  } catch (error) {
    console.error("❌ Error updating language:", error);
    return res.status(500).json({ 
      error: "Failed to update language." 
    });
  }
};