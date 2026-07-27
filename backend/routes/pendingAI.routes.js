// routes/pendingAI.routes.js
const express = require("express");
const router = express.Router();
const pendingAIController = require("../controllers/pendingAI.controllers");

router.get("/queue", pendingAIController.getQueue);
router.post("/bulk-action", pendingAIController.bulkAction);
router.post("/:id/approve", pendingAIController.approveResponse);
router.post("/:id/edit", pendingAIController.editAndApproveResponse);
router.post("/:id/reject", pendingAIController.rejectResponse);
module.exports = router;