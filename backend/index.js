require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose"); 
const http = require("http");
const { Server } = require("socket.io");

const User = require("./models/User"); 
const whatsappController = require("./controllers/whatsapp.controllers"); 

const app = express();

// ✅ Updated CORS configuration for both Express and Socket.io
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-whatsapp-assistant-one.vercel.app",
];

// 1. Create HTTP server wrapper around Express
const server = http.createServer(app);

// 2. Initialize Socket.io with updated CORS settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }
});

// 3. Make 'io' instance globally accessible
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

// ✅ Updated CORS middleware for Express
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      // Check if origin is allowed
      if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        console.log('❌ CORS blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, 
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Pre-flight requests
app.options('/*', cors());

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
  res.send("Replyly Server Running");
});

app.get("/health", (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Logging middleware
console.log("server file running");

app.use((req, res, next) => {
  console.log("➡️ Incoming:", req.method, req.url);
  console.log("📡 Origin:", req.headers.origin);
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

// 4. Listen on HTTP Server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);