// server/controllers/businessProfile.controller.js
const BusinessProfile = require("../models/BusinessProfile");
const { generateBusinessKnowledge } = require("../services/businessKnowledgeGenerator");

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
 * Creates or updates the business profile and triggers the AI Knowledge Pipeline
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

    let profile = await BusinessProfile.findOne({ expertSystemID });
    let affectedCategories = null; // null triggers full generation (all categories)

    if (profile) {
      // 1. Detect which specific sections changed for selective generation
      const newProducts = products || [];
      const newServices = services || [];
      const newPolicies = policies || [];

      const changedProducts = JSON.stringify(profile.products || []) !== JSON.stringify(newProducts);
      const changedServices = JSON.stringify(profile.services || []) !== JSON.stringify(newServices);
      const changedPolicies = JSON.stringify(profile.policies || []) !== JSON.stringify(newPolicies);

      if (changedProducts || changedServices || changedPolicies) {
        affectedCategories = [];
        if (changedProducts) affectedCategories.push("product", "pricing", "upsell", "objection");
        if (changedServices) affectedCategories.push("service", "pricing", "lead_qualification");
        if (changedPolicies) affectedCategories.push("policy", "general");

        // Deduplicate category array
        affectedCategories = [...new Set(affectedCategories)];
      }

      // 2. Increment profile version and update fields
      profile.profileVersion = (profile.profileVersion || 1) + 1;
      profile.businessName = businessName.trim();
      profile.businessDescription = businessDescription?.trim() || "";
      profile.products = newProducts;
      profile.services = newServices;
      profile.policies = newPolicies;
      profile.additionalInstructions = additionalInstructions?.trim() || "";
      profile.tone = tone || "Professional";
      profile.language = language || "English";

      await profile.save();
      console.log(`✅ [Business Profile] Updated profile (v${profile.profileVersion}) for expertSystemID: ${expertSystemID}`);
    } else {
      // 3. Create brand-new profile
      profile = await BusinessProfile.create({
        expertSystemID,
        businessName: businessName.trim(),
        businessDescription: businessDescription?.trim() || "",
        products: products || [],
        services: services || [],
        policies: policies || [],
        additionalInstructions: additionalInstructions?.trim() || "",
        tone: tone || "Professional",
        language: language || "English",
        profileVersion: 1
      });
      console.log(`✅ [Business Profile] Created new profile (v1) for expertSystemID: ${expertSystemID}`);
    }

    // 4. Trigger Knowledge Pipeline asynchronously (non-blocking)
    generateBusinessKnowledge(profile, affectedCategories).catch((err) => {
      console.error("❌ [Knowledge Pipeline] Background generation failed:", err.message);
    });

    return res.status(200).json({
      success: true,
      message: "Business profile saved successfully. AI Knowledge Pipeline triggered.",
      profileVersion: profile.profileVersion,
      data: profile
    });

  } catch (error) {
    console.error("❌ Error saving business profile:", error);
    
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
 * Alias for createOrUpdateProfile
 */
exports.updateProfile = async (req, res) => {
  return exports.createOrUpdateProfile(req, res);
};

/**
 * DELETE /api/business-profile
 */
exports.deleteProfile = async (req, res) => {
  try {
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID || req.body.expertSystemID;

    if (!expertSystemID) {
      return res.status(400).json({ 
        error: "Missing expertSystemID context parameter." 
      });
    }

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