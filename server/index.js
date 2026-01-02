require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

app.get("/", (req, res) => {
  res.send("Gemini API Server Running");
});

// routes
const contentRoutes = require("./routes/content.routes");
app.use("/api", contentRoutes);

const whatsappRoutes = require('./routes/whatsapp.routes');
app.use('/whatsapp', whatsappRoutes);

app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

