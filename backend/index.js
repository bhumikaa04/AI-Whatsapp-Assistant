require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); 
const http = require("http");
const { Server } = require("socket.io");

const User = require("./models/User"); 
const whatsappController = require("./controllers/whatsapp.controllers"); 

const app = express();

// 1. Create HTTP server wrapper around Express
const server = http.createServer(app);

// 2. Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// 3. Make 'io' instance globally accessible across controllers via req.app.get("io")
app.set("io", io);

// Socket.io Connection Event Listener
io.on("connection", (socket) => {
  console.log(`🟢 Real-Time Client Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`🔴 Real-Time Client Disconnected: ${socket.id}`);
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
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

// Logging middleware
console.log("server file running");

app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  next();
});

// Routes
const whatsappRoutes = require('./routes/whatsapp.routes');
app.use('/whatsapp', whatsappRoutes);

const contentRoutes = require("./routes/content.routes");
app.use("/api", contentRoutes);

const expertSystemRoutes = require('./routes/expertSystem.routes'); 
app.use("/expert-system", expertSystemRoutes); 
app.use("/faqs", require("./routes/faq.routes"));
app.use("/ai", require("./routes/ai.routes"));
app.use("/analytics", require("./routes/analytics.routes"));
app.use("/otp", require("./routes/otp.routes")); 
app.use("/user", require("./routes/user.routes"));
app.use("/conversations", require("./routes/conversations.routes")); 
app.use("/auth", require("./routes/auth.routes")); 
app.use("/pending-ai", require("./routes/pendingAI.routes"));
app.use("/business-profile", require("./routes/BusinessProfile.routes")); 

// 4. Listen on HTTP Server (which handles both REST endpoints & WebSockets)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);