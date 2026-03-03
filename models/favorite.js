const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  placeName: String,
  district: String,
  savedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Favorite", favoriteSchema);