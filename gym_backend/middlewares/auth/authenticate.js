// middlewares/auth/authenticate.js
const jwt = require("jsonwebtoken");

module.exports = function authenticate(req, res, next) {
   
    
    const authHeader = req.headers.authorization;
  

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    
    try {
        console.log("🔍 Verifying JWT token...");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        req.user = decoded;
        next();
    } catch (err) {
        console.error("❌ JWT verification failed:", err);
        
        if (err.name === 'TokenExpiredError') {
          
            return res.status(401).json({ message: "Token expired" });
        }
        
        if (err.name === 'JsonWebTokenError') {
            
            return res.status(401).json({ message: "Invalid token" });
        }
        
        return res.status(401).json({ message: "Authentication failed" });
    }
};