const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { verifyAdmin } = require('../middleware/auth');

// Danger: Delete all products (for admin cleanup only)
router.delete('/delete-all', verifyAdmin, async (req, res) => {
  try {
    const result = await Product.deleteMany({});
    if (result.acknowledged || result.ok) {
      res.json({ message: 'All products deleted' });
    } else {
      res.status(400).json({ error: 'Delete failed' });
    }
  } catch (err) {
    console.error('Delete all products error:', err);
    res.status(400).json({ error: err.message || 'Failed to delete all products.' });
  }
});

module.exports = router;
