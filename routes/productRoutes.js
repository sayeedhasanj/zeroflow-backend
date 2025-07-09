const express = require('express');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const router = express.Router();
const Product = require('../models/Product');

// Create product with image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, sku, price, category, size, color, type, stock, quantity, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });
    const imageUrl = req.file ? req.file.path : '';
    // Parse size as array if needed
    let sizeArr = size;
    if (typeof size === 'string') {
      try { sizeArr = JSON.parse(size); } catch { sizeArr = size.split(','); }
    }
    const product = new Product({
      name,
      sku,
      price,
      category,
      size: sizeArr,
      color,
      type,
      stock: quantity || stock || 0,
      imageUrl,
      businessId
    });
    await product.save();
    // Sync inventory
    const Inventory = require('../models/inventoryModel');
    if (sku) {
      const invQty = Number(quantity || stock || 0);
      await Inventory.findOneAndUpdate(
        { sku, businessId },
        { name, quantity: invQty, price: Number(price) || 0, businessId },
        { upsert: true, new: true }
      );
    }
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all products for a business
router.get('/', async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });
    const products = await Product.find({ businessId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Product (keep your existing logic)
const { updateProduct, deleteProduct } = require('../controllers/productController');
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
