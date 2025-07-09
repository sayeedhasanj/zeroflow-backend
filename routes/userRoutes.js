
const express = require('express');
const router = express.Router();
const admin = require('../firebaseAdmin');

// Middleware to verify admin token


// Middleware to verify admin token and log decoded token for debugging
const verifyAdmin = async (req, res, next) => {
  console.log('Authorization header:', req.headers.authorization); // DEBUG
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    console.log('Decoded Firebase Token:', decodedToken); // DEBUG
    if (decodedToken.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (error) {
    console.error('Token verification error:', error); // DEBUG
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Disable/Enable user
router.post('/disable', verifyAdmin, async (req, res) => {
  const { uid, disabled } = req.body;
  try {
    await admin.auth().updateUser(uid, { disabled });
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete user
router.post('/delete', verifyAdmin, async (req, res) => {
  const { uid } = req.body;
  try {
    await admin.auth().deleteUser(uid);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send password reset email (placeholder)
router.post('/reset-password', verifyAdmin, async (req, res) => {
  const { email } = req.body;
  // This endpoint is a placeholder. In production, trigger password reset from client SDK.
  res.json({ message: 'Password reset email should be sent from client.' });
});




// Get all users for the current admin's business (protected)
const User = require('../models/User');
router.get('/all', verifyAdmin, async (req, res) => {
  try {
    // Get businessId and email from decoded Firebase token (set by verifyAdmin)
    const token = req.headers.authorization?.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const businessId = decodedToken.businessId;
    const userEmail = decodedToken.email;
    if (!businessId || !userEmail) return res.status(400).json({ message: 'No businessId or email in token' });
    // Find only the currently logged-in user for this business
    const user = await User.findOne({ businessId, email: userEmail }).select('email role _id');
    if (!user) return res.json([]);
    res.json([{
      uid: user._id,
      email: user.email,
      role: user.role,
      disabled: false
    }]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
