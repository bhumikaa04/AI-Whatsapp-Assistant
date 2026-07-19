// server/routes/pendingAI.routes.js
const express = require("express");
const router = express.Router();
const pendingAIController = require("../controllers/pendingAI.controllers");

// Inject your standard session/passport token authorization check middleware layer here if available
// For instance: const { requireAuth } = require("../middleware/auth");

router.get("/queue", pendingAIController.getQueue);
router.post("/:id/approve", pendingAIController.approveResponse);
router.post("/:id/edit", pendingAIController.editAndApproveResponse);
router.post("/:id/reject", pendingAIController.rejectResponse);

module.exports = router;