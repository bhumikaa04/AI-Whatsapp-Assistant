const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const aiService = require('../services/ai.services');

// 📥 GET all FAQs dynamically filtered by expertSystemID
router.get('/', async (req, res) => {
  try {
    // Extract expertSystemID from query string or req.user context
    const expertSystemID = req.query.expertSystemID || req.user?.expertSystemID || req.user?._id;

    if (!expertSystemID) {
      return res.status(400).json({ 
        message: "Missing expertSystemID. Please provide expertSystemID in query parameters." 
      });
    }

    const faqs = await FAQ.find({ expertSystemID }).sort({ priority: -1 });
    return res.json(faqs);
  } catch (err) {
    console.error("Error fetching FAQs:", err);
    return res.status(500).json({ message: err.message });
  }
});

// 📤 POST a new FAQ entry with Vectorization
router.post('/', async (req, res) => {
  try {
    // Extract system ID dynamically from body or auth middleware
    const activeSystemID = req.body.expertSystemID || req.body.systemId || req.user?.expertSystemID || req.user?._id;

    if (!activeSystemID) {
      return res.status(400).json({ 
        message: "Missing expertSystemID context." 
      });
    }

    console.log(`🤖 Generating vector embedding for new FAQ: "${req.body.question}"`);

    // 1. Generate embedding vector string at creation time
    const vectorCoordinates = await aiService.getEmbedding(req.body.question);

    // 2. Build model document attaching the coordinates array
    const faq = new FAQ({
      expertSystemID: activeSystemID,
      question: req.body.question,
      answer: req.body.answer,
      keywords: req.body.keywords || [],
      priority: req.body.priority || 1,
      embedding: vectorCoordinates
    });

    const newFAQ = await faq.save();
    console.log(`✅ Stored vector rules inside MongoDB successfully.`);
    return res.status(201).json(newFAQ);
  } catch (err) {
    console.error("Vector creation route crash:", err);
    return res.status(400).json({ message: err.message });
  }
});

// 🗑️ DELETE an FAQ entry by its MongoDB Object ID
router.delete('/:id', async (req, res) => {
  try {
    const faqId = req.params.id;

    const deletedFaq = await FAQ.findByIdAndDelete(faqId);

    if (!deletedFaq) {
      return res.status(404).json({ 
        message: "Could not delete. FAQ entry not found in the knowledge base." 
      });
    }

    console.log(`🗑️ Successfully deleted vector knowledge entry: "${deletedFaq.question}"`);

    return res.status(200).json({ 
      message: "Deleted knowledge entry successfully.",
      id: faqId
    });

  } catch (err) {
    console.error("Error inside FAQ delete route:", err);
    return res.status(500).json({ 
      message: "Internal server error while trying to wipe knowledge entry.",
      error: err.message 
    });
  }
});

module.exports = router;