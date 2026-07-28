// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
require("dotenv").config();

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

    // Fix potential outer quote wrapping
    if (rawServiceAccount.startsWith("'") && rawServiceAccount.endsWith("'")) {
      rawServiceAccount = rawServiceAccount.slice(1, -1);
    }

    const serviceAccount = JSON.parse(rawServiceAccount);

    // Ensure raw \n in private key string gets translated to actual newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    if (!serviceAccount.project_id) {
      throw new Error('Missing project_id inside FIREBASE_SERVICE_ACCOUNT JSON.');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase initialized successfully (from FIREBASE_SERVICE_ACCOUNT)');
    }
  } else {
    console.log('⚠️ FIREBASE_SERVICE_ACCOUNT not found, checking individual variables...');

    const rawKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!rawKey || !projectId || !clientEmail) {
      console.error('Missing status:', {
        FIREBASE_PROJECT_ID: !!projectId,
        FIREBASE_CLIENT_EMAIL: !!clientEmail,
        FIREBASE_PRIVATE_KEY: !!rawKey,
      });
      throw new Error('Missing required Firebase environment variables.');
    }

    const privateKey = rawKey.replace(/\\n/g, '\n');

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
      });
      console.log('✅ Firebase initialized successfully (from individual variables)');
    }
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error;
}

module.exports = admin;