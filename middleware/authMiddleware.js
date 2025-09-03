const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ✅ Middleware to verify JWT token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. Token missing or malformed." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach decoded user info
    req.userId = decoded.id;
    req.userRole = decoded.role;
    req.userName = decoded.name;

    // ✅ If you want to skip DB call, comment out below
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Invalid user. Not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Session expired. Please login again." });
    }
    return res.status(401).json({ error: "Invalid token." });
  }
};

// ✅ Middleware to authorize roles (like admin, supervisor, etc.)
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const role = req.userRole || req.user?.role;
    if (!roles.includes(role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Role not authorized." });
    }
    next();
  };
};
