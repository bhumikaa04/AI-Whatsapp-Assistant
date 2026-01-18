const admin = require("firebase-admin");
const path = require("path");

// Resolve the path to the JSON file outside the current directory
const serviceAccount = require(path.resolve(__dirname, "../credentials.json"));

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin initialized successfully using JSON file");
  } catch (error) {
    console.error("❌ Firebase Admin initialization failed:", error.message);
  }
}

module.exports = admin;