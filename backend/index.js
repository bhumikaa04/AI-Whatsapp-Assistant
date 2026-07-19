require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); 
const User = require("./models/User") ; 
const whatsappController = require("./controllers/whatsapp.controllers"); 

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true, 
    methods: ["GET", "POST" , "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

async function startServer() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB connected"); 

  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

startServer();

app.get("/", (req, res) => {
  res.send("Gemini API Server Running");
});

// routes
console.log("server file running")

app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  next();
});
const whatsappRoutes = require('./routes/whatsapp.routes');
app.use('/whatsapp', whatsappRoutes);

const contentRoutes = require("./routes/content.routes");
app.use("/api", contentRoutes);

const expertSystemRoutes = require('./routes/expertSystem.routes'); 
app.use("/expert-system" , expertSystemRoutes); 
app.use("/faqs", require("./routes/faq.routes"));
app.use("/ai", require("./routes/ai.routes"));
app.use("/analytics", require("./routes/analytics.routes"));
app.use("/otp" , require("./routes/otp.routes")); 
app.use("/user", require("./routes/user.routes"));
app.use("/conversations" , require("./routes/conversations.routes")); 
app.use("/auth" , require("./routes/auth.routes")); 
app.use("/pending-ai", require("./routes/pendingAI.routes"));
app.use("/business-profile" , require("./routes/BusinessProfile.routes")); 



app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

