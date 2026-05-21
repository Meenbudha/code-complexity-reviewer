const mongoose = require("mongoose");

/**
 * Analysis Model
 * Stores every code analysis result linked to the user who ran it.
 * codeHash enables fast cache lookups without re-calling the AI.
 */
const AnalysisSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, required: true },
  code:      { type: String, required: true },
  language:  { type: String, required: true },
  result:    { type: Object, required: true },   // Stores complexity, warnings, suggestions
  codeHash:  { type: String, index: true },      // MD5 hash for cache lookup
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Analysis", AnalysisSchema);
