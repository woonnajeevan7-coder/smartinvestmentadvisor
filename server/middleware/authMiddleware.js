import jwt from "jsonwebtoken";

/**
 * Middleware to authenticate client request via JWT.
 * Expects header: Authorization: Bearer <token>
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token is missing or unauthorized" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("🚨 Critical Error: JWT_SECRET environment variable is missing.");
      return res.status(500).json({ error: "Authentication system configuration error" });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Contains id, email, role, etc.
    next();
  } catch (err) {
    console.warn("⚠️ Token verification failed:", err.message);
    return res.status(403).json({ error: "Invalid, expired, or corrupted token" });
  }
};

/**
 * Middleware to restrict route access based on user role.
 * @param {Array<string>|string} allowedRoles Roles that are permitted to access this resource
 */
export const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized access: session role missing" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access Denied: Insufficient privileges. Required: [${roles.join(", ")}], User has: [${req.user.role}]` 
      });
    }

    next();
  };
};
