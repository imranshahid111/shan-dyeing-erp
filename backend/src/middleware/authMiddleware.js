const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  // Allow login and database backup routes to bypass authentication
  if (req.path.includes('/auth/login') || req.path.includes('/database/backup')) {
    return next();
  }

  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "erp_secret_key");
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token expired or invalid", isExpired: true });
  }
};

module.exports = authMiddleware;
