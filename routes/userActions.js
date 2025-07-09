const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

// Middleware to verify admin token
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    if (decodedToken.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
    next();
  } catch (error) {
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

module.exports = router;
