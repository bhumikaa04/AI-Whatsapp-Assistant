// server/routes/businessProfile.routes.js
const express = require("express");
const router = express.Router();
const businessProfileController = require("../controllers/BusinessProfile.controllers");

// Middleware for authentication (if you have it)
// const { requireAuth } = require("../middleware/auth");

// ========================
// Main CRUD Routes
// ========================

/**
 * GET /api/business-profile
 * Get the business profile
 * Query params: expertSystemID
 */
router.get("/", businessProfileController.getProfile);

/**
 * POST /api/business-profile
 * Create or update the business profile
 * Body: { expertSystemID, businessName, businessDescription, products, services, policies, additionalInstructions, tone, language }
 */
router.post("/", businessProfileController.createOrUpdateProfile);

/**
 * PUT /api/business-profile
 * Update the business profile (alias for POST)
 * Body: Same as POST
 */
router.put("/", businessProfileController.updateProfile);

/**
 * DELETE /api/business-profile
 * Delete the business profile
 * Query params or body: expertSystemID
 */
router.delete("/", businessProfileController.deleteProfile);

// ========================
// Utility Routes
// ========================

/**
 * GET /api/business-profile/check
 * Check if profile exists
 * Query params: expertSystemID
 */
router.get("/check", businessProfileController.checkProfileExists);

/**
 * PATCH /api/business-profile/tone
 * Update only the tone
 * Body: { tone }
 * Query params: expertSystemID
 */
router.patch("/tone", businessProfileController.updateTone);

/**
 * PATCH /api/business-profile/language
 * Update only the language
 * Body: { language }
 * Query params: expertSystemID
 */
router.patch("/language", businessProfileController.updateLanguage);

module.exports = router;