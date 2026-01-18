require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); 
const User = require("./models/User") ; 

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

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error", err));

app.get("/", (req, res) => {
  res.send("Gemini API Server Running");
});

// routes

console.log("server file running")

app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  next();
});


const contentRoutes = require("./routes/content.routes");
app.use("/api", contentRoutes);

const whatsappRoutes = require('./routes/whatsapp.routes');
app.use('/whatsapp', whatsappRoutes);

const expertSystemRoutes = require('./routes/expertSystem.routes'); 
app.use("/api/expert-system" , expertSystemRoutes); 

app.use("/api/conversations", require("./routes/conversations.routes"));
app.use("/api/faqs", require("./routes/faq.routes"));
app.use("/api/ai", require("./routes/ai.routes"));
app.use("/api/analytics", require("./routes/analytics.routes"));
app.use("/api/auth" , require("./routes/auth.routes")); 
const settingsRoutes = require("./routes/settings.routes");
app.use("/api/user", settingsRoutes);


app.listen(3000, () =>
  console.log("Server running on http://localhost:3000")
);

