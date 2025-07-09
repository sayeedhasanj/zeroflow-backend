const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  role: { type: String, enum: ['owner', 'admin', 'staff'], default: 'owner' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
