const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_in_prod";

/**
 * Middleware: verifyToken
 * Reads the Authorization: Bearer <token> header,
 * verifies the JWT, and attaches req.user = decoded payload.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, name, email, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(403).json({ error: "Token has expired. Please log in again." });
    }
    return res.status(403).json({ error: "Invalid token. Access denied." });
  }
}

module.exports = verifyToken;
