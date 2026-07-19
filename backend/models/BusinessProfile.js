const mongoose = require("mongoose");

const BusinessProfileSchema = new mongoose.Schema({
  expertSystemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpertSystem", // Assuming your system tracker is named ExpertSystem
    required: true,
    unique: true
  },
  businessName: { type: String, required: true },
  businessDescription: { type: String, default: "" },
  products: [{ type: String }],
  services: [{ type: String }],
  policies: [{ type: String }],
  additionalInstructions: { type: String, default: "" },
  tone: { type: String, default: "Professional" },
  language: { type: String, default: "English" }
}, { timestamps: true });

module.exports = mongoose.model(
    "BusinessProfile",
    BusinessProfileSchema
);