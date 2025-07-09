const mongoose = require("mongoose");



const inventorySchema = new mongoose.Schema({
  sku: { type: String, required: true, trim: true, unique: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  price: { type: Number, required: true, min: 0 },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
}, { timestamps: true });

module.exports = mongoose.model("Inventory", inventorySchema);
