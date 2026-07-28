// backend/config/firebaseAdmin.js
const admin = require('firebase-admin');
require("dotenv").config();

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT.trim();

    // Strip wrapping quotes if added by environment managers
    if ((rawServiceAccount.startsWith('"') && rawServiceAccount.endsWith('"')) ||
        (rawServiceAccount.startsWith("'") && rawServiceAccount.endsWith("'"))) {
      rawServiceAccount = rawServiceAccount.slice(1, -1);
    }

    const serviceAccount = JSON.parse(rawServiceAccount);

    // Fix PEM formatting: Convert escaped \n strings or literal spaces back to true newlines
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key
        .replace(/\\n/g, '\n')
        .replace(/\r/g, '');
    }

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase initialized successfully (from JSON)');
    }
  } else {
    throw new Error('FIREBASE_SERVICE_ACCOUNT variable is not defined.');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  throw error;
}

module.exports = admin;