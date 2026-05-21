// ── Imports ──────────────────────────────────────────────────────────────────
require("dotenv").config();
const express     = require("express");
const cors        = require("cors");
const helmet      = require("helmet");
const axios       = require("axios");
const crypto      = require("crypto");
const mongoose    = require("mongoose");
const rateLimit   = require("express-rate-limit");
const authRoutes  = require("./routes/auth");
const verifyToken = require("./middleware/authMiddleware");
const Analysis    = require("./models/Analysis"); // ✅ Moved to its own model file

// ── App Initialization ────────────────────────────────────────────────────────
const app = express();
const PORT           = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

// ── Security Middlewares ──────────────────────────────────────────────────────

// CORS — FIX #1: Restrict to known origins only (was fully open)
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  process.env.FRONTEND_URL,              // set this in production .env
  "https://codemind-frontend.onrender.com"
].filter(Boolean); // Remove any undefined entries

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin '${origin}' not allowed`));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" })); // Guard against oversized payloads at middleware level

// ── Global Rate Limiter (all routes) ─────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down and try again later." }
});
app.use(globalLimiter);

// ── Auth Routes (/auth/register, /auth/login, /auth/me) ──────────────────────
app.use("/auth", authRoutes);

// ── Database Connection ───────────────────────────────────────────────────────
const dbURI = process.env.MONGO_URL || "mongodb://localhost:27017/codemind";

mongoose.connect(dbURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// ── Helper: MD5 hash of trimmed code ─────────────────────────────────────────
function hashCode(code) {
  return crypto.createHash("md5").update(code.trim()).digest("hex");
}

// ── Routes ───────────────────────────────────────────────────────────────────

// Health Check
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "CodeMind Backend", port: PORT });
});

// ── POST /analyze — Forward to ML service & cache in MongoDB ─────────────────
app.post("/analyze", verifyToken, async (req, res) => {
  try {
    const { code, language } = req.body;

    // FIX #2 (part of Critical #1): Input validation — guard against empty/huge payloads
    if (!code || typeof code !== "string" || !code.trim()) {
      return res.status(400).json({ error: "Code is required." });
    }
    if (code.length > 50000) {
      return res.status(413).json({ error: "Code too large. Maximum 50,000 characters." });
    }
    if (!language) {
      return res.status(400).json({ error: "Language is required." });
    }

    const codeHash = hashCode(code);

    // Cache lookup — analysis results are not user-specific, so global cache is fine
    const cached = await Analysis.findOne({ codeHash }).sort({ timestamp: -1 });
    if (cached) {
      console.log(`⚡ Cache HIT  [${codeHash.slice(0, 8)}…] — skipping AI call`);
      return res.json({ ...cached.result, _id: cached._id, _cached: true });
    }
    console.log(`🔍 Cache MISS [${codeHash.slice(0, 8)}…] — calling ML service`);

    // Call ML Service
    const response = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      { code, language },
      { headers: { "Content-Type": "application/json" }, timeout: 40000 }
    );

    const resultData = response.data;

    // FIX #1 (Critical): Save with userId so this record belongs to the authenticated user
    const newAnalysis = new Analysis({
      userId: req.user.id,   // ✅ ADDED — scopes this record to the logged-in user
      code,
      language,
      result: resultData,
      codeHash
    });
    await newAnalysis.save();

    res.json({ ...resultData, _id: newAnalysis._id, _cached: false });

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        time: "Timeout", space: "Timeout",
        warnings: ["ML service took too long to respond."],
        suggestions: ["Please try again in a few seconds."]
      });
    }
    if (error.response) {
      console.warn(`⚠️  ML Service ${error.response.status}:`, error.response.data?.error);
      return res.status(error.response.status).json(error.response.data);
    }
    console.error("Error connecting to ML Service:", error.message);
    res.status(500).json({
      time: "Error", space: "Error",
      warnings: ["Could not connect to ML Service (Python)"],
      suggestions: ["Ensure app.py is running on port 8000"]
    });
  }
});

// ── GET /history — Return only THIS user's analysis history ──────────────────
app.get("/history", verifyToken, async (req, res) => {
  try {
    // FIX #1 (Critical): Filter by userId — was returning ALL users' history
    const history = await Analysis
      .find({ userId: req.user.id })  // ✅ ADDED — user-scoped query
      .sort({ timestamp: -1 })
      .limit(20);

    res.json(history);
  } catch (error) {
    console.error("History fetch error:", error.message);
    res.status(500).json({ error: "Could not fetch history." });
  }
});

// ── POST /ask-ai — Forward chat to ML service ────────────────────────────────
app.post("/ask-ai", verifyToken, async (req, res) => {
  try {
    // Basic input validation
    const { code, question, history } = req.body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ answer: "Question cannot be empty." });
    }

    const response = await axios.post(
      `${ML_SERVICE_URL}/ask-ai`,
      { code, question, history: history || [] },
      { headers: { "Content-Type": "application/json" }, timeout: 40000 }
    );

    res.json(response.data);

  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        answer: "The AI Assistant took too long to respond. Please try again in a moment."
      });
    }
    console.error("Error connecting to AI Service:", error.message);
    res.status(500).json({
      answer: "The AI Assistant is currently unavailable."
    });
  }
});

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Node Backend running on http://localhost:${PORT}`);
  console.log(`🤖 ML Service target: ${ML_SERVICE_URL}`);
  console.log(`🛡️  CORS allowed origins: ${allowedOrigins.join(", ")}`);
});