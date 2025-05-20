// server/middleware/auth.js
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;

// Authenticate JWT and attach req.user
function authenticateJWT(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) return res.status(401).json({ msg: "No token, auth denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ msg: "Token invalid" });
  }
}

// Authorize only specific roles
function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ msg: "Not authenticated" });
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Forbidden: insufficient rights" });
    }
    next();
  };
}

module.exports = { authenticateJWT, authorizeRoles };
