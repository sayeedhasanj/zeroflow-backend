const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['Clothing', 'Clothing + Accessories'], default: 'Clothing' },
  focus: { type: String, enum: ['Men', 'Women', 'Both'], default: 'Both' },
  mobile: { type: String, required: true },
  address: { type: String, required: true },
  website: { type: String },
  logo: { type: String }, // URL or path to logo
}, { timestamps: true });

module.exports = mongoose.model("Business", businessSchema);
