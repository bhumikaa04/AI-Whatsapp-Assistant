// routes/faq.routes.js
const express = require('express');
const router = express.Router();
const FAQ = require('../models/FAQ');
const aiService = require('../services/ai.services'); // Make sure this path points to your ai.service

// GET all FAQs (unchanged)
router.get('/', async (req, res) => {
  try {
    const targetSystemID = "696bae6cdb66668f55b0cf3b"; 
    const faqs = await FAQ.find({ expertSystemID: targetSystemID }).sort({ priority: -1 }); 
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 📤 POST a new FAQ entry with Vectorization!
router.post('/', async (req, res) => {
  try {
    const activeSystemID = req.body.systemId || "696bae6cdb66668f55b0cf3b";
    
    console.log(`🤖 Generating vector embedding for new FAQ: "${req.body.question}"`);
    

    // 1. Generate embedding vector string at creation time!
    const vectorCoordinates = await aiService.getEmbedding(req.body.question);

    // 2. Build model document attaching the coordinates array
    const faq = new FAQ({
      expertSystemID: activeSystemID,
      question: req.body.question,
      answer: req.body.answer,
      keywords: req.body.keywords || [],
      priority: req.body.priority || 1,
      embedding: vectorCoordinates // Save directly to DB space
    });

    const newFAQ = await faq.save();
    console.log(`✅ Stored vector rules inside MongoDB successfully.`);
    res.status(201).json(newFAQ);
  } catch (err) {
    console.error("Vector creation route crash:", err);
    res.status(400).json({ message: err.message });
  }
});

// 🗑️ DELETE an FAQ entry by its MongoDB Object ID
router.delete('/:id', async (req, res) => {
  try {
    const faqId = req.params.id;

    // 1. Attempt to find and delete the document in one step
    const deletedFaq = await FAQ.findByIdAndDelete(faqId);

    // 2. If no document was found with that ID, return a 404
    if (!deletedFaq) {
      return res.status(404).json({ 
        message: "Could not delete. FAQ entry not found in the knowledge base." 
      });
    }

    console.log(`🗑️ Successfully deleted vector knowledge entry: "${deletedFaq.question}"`);

    // 3. Return a clean success confirmation message back to React
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