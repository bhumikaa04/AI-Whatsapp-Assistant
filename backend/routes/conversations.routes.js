// routes/conversations.routes.js
const express = require("express");
const router = express.Router();
const conversationsController = require("../controllers/conversation.controllers");

// Maps directly to API.get("/conversations") inside your main listing component
router.get("/", conversationsController.getAllConversations);

// Maps directly to API.get(`/leads/${id}`) or API.get(`/conversations/${id}`) in your details view
router.get("/:id", conversationsController.getConversationById);

// Maps directly to API.post(`/conversations/${id}/reply`) when pushing an outbound text response
router.post("/:id/reply", conversationsController.sendManualReply);

module.exports = router;