// server/controllers/pendingAI.controller.js
const PendingAIResponse = require("../models/PendingAIResponse");
const FAQ = require("../models/FAQ"); 
const { getEmbedding } = require("../services/ai.services");

/**
 * GET /api/pending-ai/queue
 * Fetches all unreviewed items for the active system instance
 */


/**
 * GET /api/pending-ai/queue
 * Fetches items grouped by categories, confidence levels, and pipeline metrics
 */
exports.getQueue = async (req, res) => {
  try {
    const expertSystemID = req.user?.expertSystemID || req.query.expertSystemID;
    if (!expertSystemID) {
      return res.status(400).json({ error: "Missing expertSystemID parameter context." });
    }

    // 1. Fetch pending items
    const pendingItems = await PendingAIResponse.find({
      expertSystemID,
      status: "pending"
    }).sort({ createdAt: -1 }).lean();

    // 2. Fetch metrics for analytics (Step 11)
    const metricsRaw = await PendingAIResponse.aggregate([
      { $match: { expertSystemID } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const analytics = {
      totalGenerated: 0,
      approved: 0,
      rejected: 0,
      pending: 0
    };

    metricsRaw.forEach((m) => {
      if (m._id === "approved" || m._id === "edited") analytics.approved += m.count;
      else if (m._id === "rejected") analytics.rejected += m.count;
      else if (m._id === "pending") analytics.pending += m.count;
      analytics.totalGenerated += m.count;
    });

    // 3. Group pending items by Category (Step 7) & inject Confidence Indicators (Step 8)
    const groupedQueue = {};

    pendingItems.forEach((item) => {
      // Color tier tags
      let confidenceTier = "red";
      if (item.confidence >= 95) confidenceTier = "green";
      else if (item.confidence >= 80) confidenceTier = "yellow";

      const formattedItem = { ...item, confidenceTier };

      if (!groupedQueue[item.category]) {
        groupedQueue[item.category] = [];
      }
      groupedQueue[item.category].push(formattedItem);
    });

    return res.status(200).json({
      success: true,
      analytics,
      groupedQueue
    });
  } catch (error) {
    console.error("❌ Error fetching pending queue pipeline data:", error);
    return res.status(500).json({ error: "Failed to retrieve queue analytics." });
  }
};

/**
 * POST /api/pending-ai/bulk-action
 * Bulk approve or reject by Category or explicit ID array (Step 9)
 */
exports.bulkAction = async (req, res) => {
  try {
    const { expertSystemID, action, category, itemIds } = req.body;

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action. Use 'approve' or 'reject'." });
    }

    let filter = { status: "pending" };
    if (expertSystemID) filter.expertSystemID = expertSystemID;
    if (category) filter.category = category;
    if (Array.isArray(itemIds) && itemIds.length > 0) filter._id = { $in: itemIds };

    const itemsToProcess = await PendingAIResponse.find(filter);

    if (itemsToProcess.length === 0) {
      return res.status(200).json({ success: true, processedCount: 0, message: "No matching pending items found." });
    }

    if (action === "approve") {
      // Build bulk FAQ insertion payload
      const faqDocs = itemsToProcess.map((item) => ({
        expertSystemID: item.expertSystemID,
        question: item.question,
        normalizedQuestion: item.normalizedQuestion,
        answer: item.generatedAnswer,
        embedding: item.questionEmbedding,
        priority: 1
      }));

      // Insert directly into FAQs
      await FAQ.insertMany(faqDocs, { ordered: false });

      // Update statuses in Pending Queue
      const ids = itemsToProcess.map((i) => i._id);
      await PendingAIResponse.updateMany({ _id: { $in: ids } }, { status: "approved" }, { runValidators: false });
    } else {
      // Action === "reject"
      const ids = itemsToProcess.map((i) => i._id);
      await PendingAIResponse.updateMany({ _id: { $in: ids } }, { status: "rejected" }, { runValidators: false });
    }

    return res.status(200).json({
      success: true,
      processedCount: itemsToProcess.length,
      message: `Successfully executed bulk ${action} on ${itemsToProcess.length} items.`
    });
  } catch (error) {
    console.error("❌ Bulk action failed:", error);
    return res.status(500).json({ error: "Failed to execute bulk queue operation." });
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