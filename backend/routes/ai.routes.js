const router = require("express").Router();

router.post("/respond", async (req, res) => {
  res.json({ reply: "AI response placeholder" });
});

router.post("/test", async (req, res) => {
  res.json({ success: true });
});

router.get("/status", (req, res) => {
  res.json({ status: "ok" });
});

module.exports = router;
