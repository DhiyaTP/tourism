const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name: String,
  district: String,
  description: String,
  location: String,
  activities: [String],
  image: String
});

module.exports = mongoose.model("Place", placeSchema);