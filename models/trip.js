const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  district: String,
  days: Number,
  interest: String,
  plan: Array,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Trip", tripSchema);