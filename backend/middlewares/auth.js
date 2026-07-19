const admin = require("../config/firebaseAdmin");

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token found");
      return res.status(401).json({ 
        success: false, 
        message: "No authentication token provided" 
      });
    }

    const token = authHeader.split("Bearer ")[1];
    
    if (!token) {
      console.log("❌ Token is empty");
      return res.status(401).json({ 
        success: false, 
        message: "Token is empty" 
      });
    }

    console.log("🔍 Verifying token...");
    
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    console.log("✅ Token verified for:", decodedToken.email);
    
    // Attach user info to request
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || decodedToken.email?.split('@')[0],
      photo: decodedToken.picture,
      ...decodedToken
    };

    next();
  } catch (error) {
    console.error("❌ Token verification failed:", error.message);
    
    // Specific error messages
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ 
        success: false, 
        message: "Token expired. Please sign in again." 
      });
    }
    
    if (error.code === 'auth/argument-error') {
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token format." 
      });
    }

    return res.status(401).json({ 
      success: false, 
      message: "Authentication failed. Invalid token." 
    });
  }
};

module.exports = authMiddleware;