// server/routes/auth.routes.js
const express = require("express");
const router = express.Router();

const authMiddleware = require("../middlewares/auth");
const authController = require("../controllers/auth.controllers");


// Sync Firebase user
router.post("/sync-user", authMiddleware, authController.syncUser);


module.exports = router;
