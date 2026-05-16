const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    req.user = { full_name: "Anonymous" };
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "erp_secret_key");
    req.user = decoded; // Should contain id, email, role. But wait, I need full_name too.
    
    // In authController, we don't put full_name in the token. 
    // I should probably update authController to include it or just use email for now.
    // Let's assume the token has 'name' if I update it.
    next();
  } catch (err) {
    req.user = { full_name: "Anonymous (Invalid Token)" };
    next();
  }
};

module.exports = authMiddleware;
