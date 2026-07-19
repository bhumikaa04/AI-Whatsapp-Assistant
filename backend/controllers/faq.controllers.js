// controllers/faq.controller.js
const FAQ = require("../models/FAQ");
require("dotenv").config();

exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, priority } = req.body;

    // 1. Validation
    if (!question || !answer) {
      return res.status(400).json({ message: "Question and answer fields are required." });
    }

    // 💡 INTERVIEW HINT / TODO: 
    // Right now, we'll hardcode or fetch a temporary workspace ID.
    // When you tie in your true auth middleware, this will be: req.user.expertSystemID or req.body.expertSystemID
    // Let's create a placeholder fallback or check if your frontend/middleware sends it.
    const expertSystemID = req.body.expertSystemID; // Matching your active user log id!

    // 2. Create the document instance
    const newFaq = new FAQ({
      expertSystemID,
      question: question.trim(),
      answer: answer.trim(),
      keywords: keywords || [],
      priority: priority || 1
    });

    // 3. Save to MongoDB
    await newFaq.save();

    console.log(`✨ New FAQ added to Knowledge Base: "${question}"`);
    
    // 4. Return the newly created item back to React
    return res.status(201).json(newFaq);

  } catch (error) {
    console.error("Error creating FAQ:", error);
    return res.status(500).json({ message: "Internal server error while saving FAQ entry." });
  }
};

/**
 * Fetch all FAQs for the active configuration layout
 */
exports.getAllFAQs = async (req, res) => {
  try {
    const expertSystemID = req.body.expertSystemID; // Keep synchronized with your tenant profile id for now
    
    const faqs = await FAQ.find({ expertSystemID }).sort({ createdAt: -1 });
    return res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return res.status(500).json({ message: "Internal server error while retrieving knowledge base." });
  }
};