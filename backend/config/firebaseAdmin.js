// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
require("dotenv").config();

// Method 1: Load from complete JSON string (RECOMMENDED)
try {
  // Check if we have the complete JSON
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    
    // Validate required fields
    if (!serviceAccount.project_id) {
      throw new Error('Missing project_id in Firebase credentials');
    }
    
    // Initialize with full service account
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase initialized successfully (from complete JSON)');
    }
  } else {
    // Fallback to individual environment variables
    console.log('⚠️ Using individual Firebase environment variables');
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY 
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
      : undefined;
    
    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error('Missing required Firebase environment variables');
    }
    
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
      console.log('✅ Firebase initialized successfully (from individual vars)');
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error;
}

module.exports = admin;