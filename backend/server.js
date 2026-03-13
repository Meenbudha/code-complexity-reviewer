// 1️⃣ Imports
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose"); // 1. Import Mongoose

// 2️⃣ App initialization
const app = express();
const PORT = 5000; // Frontend calls this port

// 3️⃣ Middlewares
app.use(cors()); // Allow Frontend (Port 3000) to access this
app.use(express.json());

// 4️⃣ Database Connection
// Connect to MongoDB (Removed deprecated options)
mongoose.connect("mongodb://localhost:27017/codemind")
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

// 5️⃣ Define Schema
const AnalysisSchema = new mongoose.Schema({
  code: String,
  language: String,
  result: Object, // Stores complexity, warnings, etc.
  timestamp: { type: Date, default: Date.now }
});

const Analysis = mongoose.model("Analysis", AnalysisSchema);

// 6️⃣ Routes

// Health Check
app.get("/", (req, res) => {
  res.send("Node.js Backend Gateway is running on Port 5000");
});

// Forward Analysis Request to Python (Port 8000) & Save to DB
app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Call ML Service
    const response = await axios.post("http://localhost:8000/analyze", {
      code,
      language
    });

    const resultData = response.data;

    // Save result to MongoDB
    const newAnalysis = new Analysis({
      code,
      language,
      result: resultData
    });
    
    await newAnalysis.save(); // Save to DB

    // Send back result + the new DB ID
    res.json({ ...resultData, _id: newAnalysis._id });

  } catch (error) {
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
    const response = await axios.post("http://localhost:8000/ask-ai", {
      code: req.body.code,
      question: req.body.question
    });

    res.json(response.data);
  } catch (error) {
    console.error("Error connecting to AI Service:", error.message);
    res.status(500).json({ answer: "AI service unavailable. Is the Python backend running?" });
  }
});

// 7️⃣ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Node Backend running on http://localhost:${PORT}`);
});