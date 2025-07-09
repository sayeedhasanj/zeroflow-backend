
const express = require("express");
const router = express.Router();
const Inventory = require("../models/inventoryModel");
const { verifyAdmin, verifyUser } = require("../middleware/auth");

// Danger: Delete all inventory (for admin cleanup only)
router.delete("/delete-all", verifyAdmin, async (req, res) => {
  try {
    await Inventory.deleteMany({});
    res.json({ message: "All inventory deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete all inventory." });
  }
});



// Get all inventory for a business
router.get("/", verifyUser, async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });
    const items = await Inventory.find({ businessId });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory." });
  }
});



// Add inventory item
router.post("/add", verifyAdmin, async (req, res) => {
  try {
    const { sku, name, quantity, price, businessId } = req.body;
    if (!businessId) return res.status(400).json({ error: 'businessId is required' });
    const existing = await Inventory.findOne({ sku, businessId });
    if (existing) return res.status(400).json({ error: "SKU already exists for this business." });
    const newItem = new Inventory({ sku, name, quantity, price, businessId });
    await newItem.save();
    res.json({ message: "Item added", item: newItem });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to add item." });
  }
});



// Edit inventory item
router.put("/edit/:sku", verifyAdmin, async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const updated = await Inventory.findOneAndUpdate(
      { sku: req.params.sku },
      { name, quantity, price },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: "Item not found" });

    // Also update the matching product's stock to match inventory quantity
    const Product = require('../models/Product');
    await Product.findOneAndUpdate(
      { sku: req.params.sku },
      { stock: quantity },
      { new: true }
    );

    res.json({ message: "Item updated", item: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to update item." });
  }
});




// Delete item (force delete by SKU, even if orphaned)
router.delete("/delete/:sku", verifyAdmin, async (req, res) => {
  try {
    const deleted = await Inventory.findOneAndDelete({ sku: req.params.sku });
    if (!deleted) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete item." });
  }
});

// Danger: Delete all inventory (for admin cleanup only)
router.delete("/delete-all", verifyAdmin, async (req, res) => {
  try {
    await Inventory.deleteMany({});
    res.json({ message: "All inventory deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete all inventory." });
  }
});

module.exports = router;
