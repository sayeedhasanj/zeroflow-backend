const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  size: [String],
  color: String,
  type: String,
  category: String,
  stock: { type: Number, default: 0 },
  price: Number,
  imageUrl: String,
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
});

module.exports = mongoose.model('Product', productSchema);
