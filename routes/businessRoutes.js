const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup for logo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/business-logos');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Register Business
router.post('/register', upload.single('logo'), async (req, res) => {
  try {
    const { name, type, focus, mobile, address, website } = req.body;
    let logo = '';
    if (req.file) {
      logo = '/uploads/business-logos/' + req.file.filename;
    }
    const business = new Business({ name, type, focus, mobile, address, website, logo });
    await business.save();
    res.json({ business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Owner (user) for a business
router.post('/register-owner', async (req, res) => {
  try {
    const { name, email, password, businessId, firebaseUid } = req.body;
    if (!name || !email || !password || !businessId || !firebaseUid) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use.' });
    const hash = await bcrypt.hash(password, 10);
    // Always set role to 'admin' for the first owner
    const user = new User({ name, email, password: hash, businessId, role: 'admin' });
    await user.save();
    // Set Firebase custom claims for this user
    const admin = require('../firebaseAdmin');
    await admin.auth().setCustomUserClaims(firebaseUid, { role: 'admin', businessId });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get business by ID
router.get('/:id', async (req, res) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json({ business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get business by owner email (fallback)
router.get('/by-owner-email/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user || !user.businessId) return res.status(404).json({ error: 'User or business not found' });
    const business = await Business.findById(user.businessId);
    if (!business) return res.status(404).json({ error: 'Business not found' });
    res.json({ business });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
