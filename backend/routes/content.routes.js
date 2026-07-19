const express = require("express");
const router = express.Router();
const { generateGeminiResponse } = require("../services/gemini.services");

router.post("/content", async (req, res) => {
  const prompt = req.body.question;

  if (!prompt || prompt.trim() === "") {
    return res.json({ result: "Invalid request: empty question." });
  }

  const output = await generateGeminiResponse(prompt);
  res.json({ result: output });
});

module.exports = router;
