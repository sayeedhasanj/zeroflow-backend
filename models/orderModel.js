const mongoose = require('mongoose');



const orderSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      productName: { type: String },
      size: { type: String },
      quantity: { type: Number, required: true },
      unitPrice: { type: Number, required: true }
    }
  ],
  customerName: { type: String, required: true },
  customerMobile: { type: String, required: true },
  customerEmail: { type: String },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
