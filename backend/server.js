// 1️⃣ Imports
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const mongoose = require("mongoose"); // 1. Import Mongoose

// 2️⃣ App initialization
const app = express();
const PORT = process.env.PORT || 5000;
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "https://codemind-ml-service.onrender.com"; // Frontend calls this port

// 3️⃣ Middlewares
app.use(cors()); // Allow Frontend (Port 3000) to access this
app.use(express.json());

// 4️⃣ Database Connection
// Check for Render's environment variable first, otherwise use local database
const dbURI = process.env.MONGO_URI || "mongodb://localhost:27017/codemind";

mongoose.connect(dbURI)
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
  res.send(`Node.js Backend Gateway is running on Port ${PORT}`);
});

// Forward Analysis Request to Python (Port 8000) & Save to DB
app.post("/analyze", async (req, res) => {
  try {
    const { code, language } = req.body;
    
    // Call ML Service
    const response = await axios.post(
      `${ML_SERVICE_URL}/analyze`,
      { code, language },
      {
        headers: {
          "Content-Type": "application/json"
        },
        timeout: 40000 // INCREASED: Gemini AI often takes 5-15 seconds!
      }
    );

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

  } 
  catch (error) {

    if (error.code === "ECONNABORTED") {
      return res.status(504).json({
        time: "Timeout",
        space: "Timeout",
        warnings: ["ML service took too long to respond."],
        suggestions: ["Please try again in a few seconds. The AI might be under heavy load."]
      });
    }

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
        question: req.body.question
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

// 7️⃣ Start Server
app.listen(PORT, () => {
  console.log(`🚀 Node Backend running on http://localhost:${PORT}`);
});