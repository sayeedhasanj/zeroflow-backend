const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/inventoryModel');
const { verifyUser } = require('../middleware/auth');



// Get all products for a business, joined with inventory info (quantity, price)
router.get('/products', verifyUser, async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });
    // Get all products for this business
    const products = await Product.find({ businessId });
    // Get all inventory for this business
    const inventoryItems = await Inventory.find({ businessId });
    // Map inventory by SKU for quick lookup
    const inventoryMap = {};
    inventoryItems.forEach(item => { inventoryMap[item.sku] = item; });
    // Attach inventory info to each product
    const result = products.map(prod => ({
      ...prod.toObject(),
      inventory: inventoryMap[prod.sku] || { quantity: 0, price: prod.price }
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch products with inventory.' });
  }
});

module.exports = router;
