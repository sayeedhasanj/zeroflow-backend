const Inventory = require('../models/inventoryModel');
const Product = require('../models/Product');
exports.updateProduct = async (req, res) => {
  try {
    const { businessId } = req.body;
    if (!businessId) return res.status(400).json({ message: 'businessId is required' });
    // Ensure the product belongs to the business
    const product = await Product.findOne({ _id: req.params.id, businessId });
    if (!product) return res.status(404).json({ message: 'Product not found or access denied' });
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    // Sync inventory by SKU
    if (updated && updated.sku) {
      // Use stock or quantity from product, fallback to 0
      const quantity = updated.stock ?? updated.quantity ?? 0;
      await Inventory.findOneAndUpdate(
        { sku: updated.sku, businessId },
        { name: updated.name, quantity, price: updated.price ?? 0, businessId },
        { upsert: true, new: true }
      );
    }
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, quantity, price } = req.body;
    const product = new Product({ name, sku, quantity, price });
    await product.save();
    // Sync inventory by SKU
    if (sku) {
      await Inventory.findOneAndUpdate(
        { sku },
        { name, quantity: quantity ?? 0, price: price ?? 0 },
        { upsert: true, new: true }
      );
    }
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: 'Product creation failed' });
  }
};


exports.deleteProduct = async (req, res) => {
  try {
    const { businessId } = req.body;
    if (!businessId) return res.status(400).json({ message: 'businessId is required' });
    // Find the product to get its SKU and businessId, and ensure it belongs to the business
    const product = await Product.findOne({ _id: req.params.id, businessId });
    if (!product) return res.status(404).json({ message: 'Product not found or access denied' });
    const { sku } = product;
    // Delete the product
    await Product.findByIdAndDelete(req.params.id);
    // Delete inventory for this product (by SKU and businessId)
    if (sku && businessId) {
      await Inventory.deleteOne({ sku, businessId });
    }
    res.status(200).json({ message: 'Product and related inventory deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Delete failed' });
  }
};
