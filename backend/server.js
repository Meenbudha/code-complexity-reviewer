// Imports
require("dotenv").config(); // Load .env file
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const axios = require("axios");
const crypto = require("crypto");          // built-in — no install needed
const mongoose = require("mongoose");

// App initialization
const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

//  Middlewares
app.use(helmet({ contentSecurityPolicy: false })); // Security headers (X-Frame-Options, HSTS, etc.)
app.use(cors()); // Allow Frontend to access this API
app.use(express.json());


//  Database Connection
// Check for Render's environment variable first, otherwise use local database
const dbURI = process.env.MONGO_URL || "mongodb://localhost:27017/codemind";

mongoose.connect(dbURI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// Define Schema
const AnalysisSchema = new mongoose.Schema({
  code:      String,
  language:  String,
  result:    Object,             // Stores complexity, warnings, etc.
  codeHash:  { type: String, index: true }, // MD5 hash for cache lookup
  timestamp: { type: Date, default: Date.now }
});

const Analysis = mongoose.model("Analysis", AnalysisSchema);

// Helper: MD5 hash of trimmed code
function hashCode(code) {
  return crypto.createHash("md5").update(code.trim()).digest("hex");
}

//  Routes

// Health Check
app.get("/", (req, res) => {
  res.send(`Node.js Backend Gateway is running on Port ${PORT}`);
});

// Forward Analysis Request to Python (Port 8000) & Save to DB
app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;
    const codeHash = hashCode(code);

    // ── Cache lookup ─────────────────────────────────────────────────
    const cached = await Analysis.findOne({ codeHash }).sort({ timestamp: -1 });
    if (cached) {
      console.log(`⚡ Cache HIT  [${codeHash.slice(0, 8)}…] — skipping AI call`);
      return res.json({ ...cached.result, _id: cached._id, _cached: true });
    }
    console.log(`🔍 Cache MISS [${codeHash.slice(0, 8)}…] — calling ML service`);

    // ── Call ML Service ───────────────────────────────────────────────
    const response = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      { code, language },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 40000
      }
    );

    const resultData = response.data;

    // ── Save result + hash to MongoDB ─────────────────────────────────
    const newAnalysis = new Analysis({ code, language, result: resultData, codeHash });
    await newAnalysis.save();

    res.json({ ...resultData, _id: newAnalysis._id, _cached: false });

  } catch (error) {
    // ── Timeout ───────────────────────────────────────────────────────
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        time: "Timeout",
        space: "Timeout",
        warnings: ["ML service took too long to respond."],
        suggestions: ["Please try again in a few seconds. The AI might be under heavy load."]
      });
    }
    // ── ML service returned a non-2xx (e.g. 422 language mismatch) ────
    // Axios throws for any non-2xx — forward the ML response as-is
    if (error.response) {
      console.warn(`⚠️  ML Service returned ${error.response.status}:`, error.response.data?.error);
      return res.status(error.response.status).json(error.response.data);
    }
    // ── Network / unreachable ─────────────────────────────────────────
    console.error("Error connecting to ML Service:", error.message);
    res.status(500).json({
      time: "Error",
      space: "Error",
      warnings: ["Could not connect to ML Service (Python)"],
      suggestions: ["Ensure app.py is running on port 8000"]
    });
  }
});

// Endpoint 2: Get History
app.get("/history", async (req, res) => {
  try {
    // Fetch last 20 records, newest first
    const history = await Analysis.find().sort({ timestamp: -1 }).limit(20);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: "Could not fetch history" });
  }
});

// Forward AI Chat Request to Python (Port 8000)
app.post("/ask-ai", async (req, res) => {
  try {
    const response = await axios.post(
      `${ML_SERVICE_URL}/ask-ai`,
      {
        code: req.body.code,
        question: req.body.question,
        history: req.body.history || []
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 40000 // INCREASED: Allow time for Gemini chat response
      }
    );

    res.json(response.data);
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        answer: "The AI Assistant took too long to respond. It might be under heavy load. Please try again in a few moments."
      });
    }

    console.error("Error connecting to AI Service:", error.message);

    res.status(500).json({ answer: "The AI Assistant is currently unavailable. Please ensure the Python service is running." });
  }
});

console.log("ML SERVICE:", ML_SERVICE_URL);

//  Start Server
app.listen(PORT, () => {
  console.log(`🚀 Node Backend running on http://localhost:${PORT}`);
});