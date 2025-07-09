

const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Order = require('../models/orderModel');

const router = express.Router();

// Monthly sales bar chart
router.get('/monthly-sales', async (req, res) => {
  try {
    const { businessId } = req.query;
    let matchStage = {};
    const mongoose = require('mongoose');
    console.log('monthly-sales endpoint called with businessId:', businessId);
    if (businessId && mongoose.Types.ObjectId.isValid(businessId)) {
      matchStage = { businessId: new mongoose.Types.ObjectId(businessId) };
    } else if (businessId) {
      // Invalid businessId, return empty
      console.error('Invalid businessId received:', businessId);
      return res.status(400).json({ error: 'Invalid businessId' });
    }
    const monthlySales = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: {
            $sum: {
              $cond: [
                { $ifNull: ['$product.price', false] },
                { $multiply: ['$quantity', '$product.price'] },
                0
              ]
            }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const formatted = (monthlySales || []).map((item) => ({
      month: item._id ? `${months[item._id.month - 1]} ${item._id.year}` : '',
      sales: item.totalSales || 0
    })).filter(item => item.month);

    res.json(formatted);
  } catch (err) {
    console.error('Error in /monthly-sales:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Dashboard summary
router.get('/', async (req, res) => {
  try {
    const { businessId } = req.query;
    console.log('GET /api/summary called with businessId:', businessId);
    const Inventory = require('../models/inventoryModel');
    // Total products: count unique products in inventory (by sku) for the business, or all if no businessId
    const inventoryMatch = businessId ? { businessId: new mongoose.Types.ObjectId(businessId) } : {};
    const inventoryItems = await Inventory.find(inventoryMatch, 'sku quantity businessId');
    console.log('Inventory items found:', inventoryItems);
    const uniqueSkus = [...new Set(inventoryItems.map(item => item.sku))];
    console.log('Unique SKUs:', uniqueSkus);
    const totalProducts = uniqueSkus.length;
    const totalStock = inventoryItems.reduce((acc, item) => acc + (item.quantity || 0), 0);
    console.log('Total stock:', totalStock);

    // Total sales: same as before
    const matchStage = businessId ? { businessId: new mongoose.Types.ObjectId(businessId) } : {};
    const totalSales = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $cond: [
                { $ifNull: ['$product.price', false] },
                { $multiply: ['$quantity', '$product.price'] },
                0
              ]
            }
          },
        },
      },
    ]);
    res.json({
      totalProducts,
      totalStock,
      totalSales: totalSales[0]?.total || 0,
    });
  } catch (err) {
    console.error('Error in /api/summary:', err);
    res.status(500).json({ message: err.message });
  }
});

// Sales data for chart (sales per day)
router.get('/sales-chart', async (req, res) => {
  try {
    const { businessId } = req.query;
    const matchStage = businessId ? { businessId: new mongoose.Types.ObjectId(businessId) } : {};
    const salesPerDay = await Order.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: {
            $sum: {
              $cond: [
                { $ifNull: ['$product.price', false] },
                { $multiply: ['$quantity', '$product.price'] },
                0
              ]
            }
          },
        },
      },
      { $sort: { _id: 1 } }
    ]);
    res.json(salesPerDay);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Health check route
router.get('/ping', (req, res) => {
  res.send('pong');
});

module.exports = router;
