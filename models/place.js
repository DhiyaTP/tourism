const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema({
  name:        { type: String },
  slug:        { type: String, unique: true, sparse: true },
  district:    { type: String },
  short:       { type: String, default: "" },
  description: { type: String },
  location:    { type: String },
  activities:  [String],
  image:       { type: String },
  reach: {
    road:   { type: String },
    train:  { type: String },
    flight: { type: String }
  },
  food:     [mongoose.Schema.Types.Mixed],
  stay:     [mongoose.Schema.Types.Mixed],
  petrol:   [mongoose.Schema.Types.Mixed],
  atm:      [mongoose.Schema.Types.Mixed],
  hospital: [mongoose.Schema.Types.Mixed]
});

module.exports = mongoose.model("Place", placeSchema);