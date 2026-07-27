// controllers/faq.controller.js
const FAQ = require("../models/FAQ");
require("dotenv").config();

/**
 * Helper to resolve expertSystemID safely across req.user, req.query, and req.body
 */

/**
 * Create a new FAQ entry
 */
exports.createFAQ = async (req, res) => {
  try {
    const { question, answer, keywords, priority } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ 
        success: false, 
        message: "Question and answer fields are required." 
      });
    }

    // 🔒 Derive expertSystemID from auth or request body fallback
    const expertSystemID = resolveExpertSystemID(req);

    if (!expertSystemID) {
      return res.status(400).json({ 
        success: false, 
        message: "No active Expert System associated with this user account." 
      });
    }

    // 2. Create the document instance
    const newFaq = new FAQ({
      expertSystemID,
      question: question.trim(),
      answer: answer.trim(),
      keywords: Array.isArray(keywords) ? keywords : [],
      priority: Number(priority) || 1
    });

    // 3. Save to MongoDB (pre-save hook will handle embeddings)
    await newFaq.save();

    console.log(`✨ New FAQ added to Knowledge Base: "${question}" (System: ${expertSystemID})`);
    return res.status(201).json(newFaq);

  } catch (error) {
    console.error("Error creating FAQ:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error while saving FAQ entry." 
    });
  }
};

/**
 * Fetch all FAQs for the active tenant
 */
// exports.getAllFAQs = async (req, res) => {
//   try {
//     // 🔒 Resolve system ID dynamically
//     const expertSystemID = resolveExpertSystemID(req);

//     if (!expertSystemID) {
//       return res.status(400).json({ 
//         success: false, 
//         message: "No active Expert System associated with this user account." 
//       });
//     }

//     // 2. Strictly filter by tenant expertSystemID (or expertSystemId in schema)
//     const faqs = await FAQ.find({
//       $or: [
//         { expertSystemID },
//         { expertSystemId: expertSystemID }
//       ]
//     }).sort({ createdAt: -1 });

//     return res.status(200).json(faqs);

//   } catch (error) {
//     console.error("Error fetching FAQs:", error);
//     return res.status(500).json({ 
//       success: false, 
//       message: "Internal server error while retrieving knowledge base." 
//     });
//   }
// };


// controllers/faq.controller.js
const resolveExpertSystemID = (req) => {
  // Always query both or check user object structure
  return (
    req.user?.expertSystemID ||
    req.body?.expertSystemID ||
    req.query?.expertSystemID ||
    req.user?._id
  );
};

exports.getAllFAQs = async (req, res) => {
  try {
    const userSysId = req.user?.expertSystemID;
    const userId = req.user?._id;
    const querySysId = req.query?.expertSystemID;

    // Search for matching entries across any of the associated IDs
    const faqs = await FAQ.find({
      $or: [
        { expertSystemID: querySysId },
        { expertSystemID: userSysId },
        { expertSystemID: userId }
      ].filter(Boolean)
    }).sort({ createdAt: -1 });

    return res.status(200).json(faqs);
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return res.status(500).json({ success: false, message: "Error loading FAQs" });
  }
};
/**
 * Delete an FAQ entry safely
 */
exports.deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const expertSystemID = resolveExpertSystemID(req);

    if (!expertSystemID) {
      return res.status(400).json({ 
        success: false, 
        message: "No active Expert System associated with this user account." 
      });
    }

    // 🔒 Ensure the FAQ exists AND belongs to this user's expertSystemID
    const deletedFaq = await FAQ.findOneAndDelete({ 
      _id: id, 
      $or: [
        { expertSystemID },
        { expertSystemId: expertSystemID }
      ]
    });

    if (!deletedFaq) {
      return res.status(404).json({ 
        success: false, 
        message: "FAQ entry not found or unauthorized to delete." 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "FAQ entry deleted successfully." 
    });

  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error while deleting FAQ entry." 
    });
  }
};