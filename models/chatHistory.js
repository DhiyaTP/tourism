const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  message: String,   // ⭐ USER MESSAGE
  reply: String,     // ⭐ AI REPLY
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ChatHistory", chatHistorySchema);