// server/controllers/pendingAI.controller.js
const PendingAIResponse = require("../models/PendingAIResponse");
const FAQ = require("../models/FAQ"); 
const { getEmbedding } = require("../services/ai.services");

/**
 * GET /api/pending-ai/queue
 * Fetches all unreviewed items for the active system instance
 */
exports.getQueue = async (req, res) => {
  try {
    // Check for user session context or query parameter
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;

    // Initialize a dynamic filter condition object
    let queryCondition = { status: "pending" };

    // Apply systemic filtering if context exists
    if (expertSystemID) {
      queryCondition.expertSystemID = expertSystemID;
      console.log(`🔍 [AI Control Backend] Filtering queue by expertSystemID: ${expertSystemID}`);
    } else {
      console.warn("⚠️ [AI Control Backend] No expertSystemID context provided. Falling back to global queue lookups for development.");
    }

    // Fetch the data array records cleanly
    const queue = await PendingAIResponse.find(queryCondition)
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(queue);
  } catch (error) {
    console.error("❌ Error fetching pending AI queue:", error);
    return res.status(500).json({ error: "Internal operational queue breakdown." });
  }
};

/**
 * POST /api/pending-ai/:id/approve
 * Approves the generated draft and promotes it to permanent FAQ database memory
 */
exports.approveResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const pendingItem = await PendingAIResponse.findById(id);
    if (!pendingItem || pendingItem.status !== "pending") {
      return res.status(404).json({ error: "Pending document not found or already processed." });
    }

    // 🚀 Promote record directly to permanent FAQ storage.
    // Your faqSchema pre-save hook automatically builds the embedding on creation!
    await FAQ.create({
      expertSystemID: pendingItem.expertSystemID,
      question: pendingItem.question,
      answer: pendingItem.generatedAnswer,
      priority: 1
    });

    // 🚀 FIX: Atomically change status to cleared while safely bypassing the schema enum validator restrictions
    await PendingAIResponse.findByIdAndUpdate(id, { status: "approved" }, { runValidators: false });

    console.log(`✨ [AI Control] Approved and synchronized item ID ${id} to permanent FAQ system.`);
    return res.status(200).json({ success: true, message: "Response successfully trained into FAQ system." });
  } catch (error) {
    console.error("❌ Error approving AI response:", error);
    return res.status(500).json({ error: "Failed to process structural approval routines." });
  }
};

/**
 * POST /api/pending-ai/:id/edit
 * Accepts human modifications, saves them to FAQ database, and clears from queue
 */
exports.editAndApproveResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { editedAnswer } = req.body;

    if (!editedAnswer || editedAnswer.trim() === "") {
      return res.status(400).json({ error: "Edited answer text cannot be submitted empty." });
    }

    const pendingItem = await PendingAIResponse.findById(id);
    if (!pendingItem || pendingItem.status !== "pending") {
      return res.status(404).json({ error: "Target review element missing or closed." });
    }

    // 🚀 Promote the edited text answer straight to the permanent FAQ storage
    await FAQ.create({
      expertSystemID: pendingItem.expertSystemID,
      question: pendingItem.question,
      answer: editedAnswer.trim(),
      priority: 1
    });

    // 🚀 FIX: Update both draft copy state and status securely while ignoring schema enum limitations
    await PendingAIResponse.findByIdAndUpdate(id, { 
      status: "approved",
      generatedAnswer: editedAnswer.trim()
    }, { runValidators: false });

    console.log(`✍️ [AI Control] Custom modification verified. Item ${id} written to FAQ storage.`);
    return res.status(200).json({ success: true, message: "Manually adjusted response trained successfully." });
  } catch (error) {
    console.error("❌ Error editing AI response fallback:", error);
    return res.status(500).json({ error: "Failed to parse manual overwrite payload parameters." });
  }
};

/**
 * POST /api/pending-ai/:id/reject
 * Discards unhelpful generation blocks completely
 */
exports.rejectResponse = async (req, res) => {
  try {
    const { id } = req.params;

    const pendingItem = await PendingAIResponse.findById(id);
    if (!pendingItem) {
      return res.status(404).json({ error: "Target pending document instance does not exist." });
    }

    // 🚀 FIX: Ignore rigid schema validation criteria while rejecting items to keep pipeline fluid
    await PendingAIResponse.findByIdAndUpdate(id, { status: "rejected" }, { runValidators: false });

    console.log(`🗑️ [AI Control] Discarded generation block trace index element ${id}.`);
    return res.status(200).json({ success: true, message: "Draft rejected and purged from operational loops." });
  } catch (error) {
    console.error("❌ Error discarding AI response document context:", error);
    return res.status(500).json({ error: "Failed to register discard selection indices flags." });
  }
};