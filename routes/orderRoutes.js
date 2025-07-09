const express = require('express');
const Order = require('../models/orderModel');
const Product = require('../models/Product');

const router = express.Router();

// Danger: Delete all orders (for admin cleanup only)
router.delete("/delete-all", async (req, res) => {
  try {
    await Order.deleteMany({});
    res.json({ message: "All orders deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message || "Failed to delete all orders." });
  }
});


// Create order and update inventory
const Inventory = require('../models/inventoryModel');
router.post('/', async (req, res) => {
  try {
    const { items, customerName, customerMobile, customerEmail, businessId } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).send('No items in order');
    }
    if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).send('Customer name is required and must be valid.');
    }
    if (!customerMobile || typeof customerMobile !== 'string' || customerMobile.trim().length < 6) {
      return res.status(400).send('Customer mobile number is required and must be valid.');
    }
    // Check and update inventory for each item
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).send('Product not found');
      if ((product.stock || 0) < item.quantity) {
        return res.status(400).send(`Not enough stock for ${product.name}`);
      }
      let inv = null;
      if (product.sku) {
        inv = await Inventory.findOne({ sku: product.sku });
      }
      if (!inv) {
        inv = await Inventory.findOne({ name: product.name });
      }
      if (!inv) {
        return res.status(404).send(`No inventory found for product ${product.name}`);
      }
      if (inv.quantity < item.quantity) {
        return res.status(400).send(`Not enough inventory stock for ${product.name}`);
      }
      inv.quantity -= item.quantity;
      await inv.save();
      product.stock = inv.quantity;
      await product.save();
    }
    const order = await Order.create({
      items,
      customerName,
      customerMobile,
      customerEmail,
      businessId
    });
    res.json(order);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Get all orders
router.get('/', async (req, res) => {
  const { businessId } = req.query;
  const filter = businessId ? { businessId } : {};
  // Populate items.productId instead of productId at root
  const orders = await Order.find(filter).populate('items.productId');
  res.json(orders);
});


// PDF Invoice Download
const PDFDocument = require('pdfkit');
const Business = require('../models/Business');
router.get('/:id/invoice', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.productId');
    if (!order) return res.status(404).send('Order not found');
    const business = order.businessId ? await Business.findById(order.businessId) : null;
    const doc = new PDFDocument({ font: 'Courier' });
    const filename = `invoice-${order._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);
    // Logo (centered)
    function renderLogoAndRest(imgBuffer) {
      if (imgBuffer) {
        doc.image(imgBuffer, doc.page.width / 2 - 40, doc.y, { width: 80, align: 'center' });
        doc.moveDown();
      }
      renderRest();
    }
    if (business && business.logo) {
      try {
        const imgUrl = business.logo;
        if (imgUrl.startsWith('http')) {
          const https = require('https');
          https.get(imgUrl, (imgRes) => {
            const chunks = [];
            imgRes.on('data', chunk => chunks.push(chunk));
            imgRes.on('end', () => {
              const imgBuffer = Buffer.concat(chunks);
              renderLogoAndRest(imgBuffer);
            });
          }).on('error', () => renderLogoAndRest());
          return;
        } else {
          renderLogoAndRest(imgUrl);
          return;
        }
      } catch { renderLogoAndRest(); return; }
    }
    renderLogoAndRest();

    function renderRest() {
      // Use monospace font for embedded text look
      doc.font('Courier-Bold');
      doc.fontSize(18).text('🧾 Payment Receipt', { align: 'center' });
      doc.moveDown();
      doc.font('Courier');
      if (business) {
        doc.fontSize(12).text(business.name, { align: 'center' });
        if (business.address) doc.text(business.address, { align: 'center' });
        if (business.mobile) doc.text(business.mobile, { align: 'center' });
        if (business.website) doc.text(business.website, { align: 'center' });
      }
      doc.text('----------------------------', { align: 'center' });
      doc.moveDown(0.5);
      // Date and Receipt No
      const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
      // Receipt No: business short form + - + 4 digit order count
      let receiptNo = 'ZH-0001';
      if (business && business.name) {
        const words = business.name.trim().split(' ');
        let short = '';
        if (words.length === 1) short = words[0].slice(0, 1).toUpperCase();
        else short = words.slice(0, 2).map(w => w[0].toUpperCase()).join('');
        receiptNo = `${short}-${String(order._id).slice(-4).toUpperCase()}`;
      }
      doc.fontSize(12).text(`Date: ${dateStr}`, { align: 'center' });
      doc.text(`Receipt No: ${receiptNo}`, { align: 'center' });
      doc.moveDown();
      // Customer
      doc.text(`Customer Name: ${order.customerName || 'N/A'}`, { align: 'center' });
      doc.text(`Contact: ${order.customerMobile || 'N/A'}`, { align: 'center' });
      doc.text(`Email: ${order.customerEmail || 'N/A'}`, { align: 'center' });
      doc.moveDown();
      // Table header
      doc.font('Courier-Bold').text('Item Description     Size    Quantity   Unit Price (Tk)   Total (Tk)', { align: 'center' });
      doc.font('Courier').text('---------------------------------------------------------------------', { align: 'center' });
      // Table rows for each item
      let subtotal = 0;
      for (const item of order.items) {
        const name = (item.productName || item.productId?.name || '').padEnd(18);
        const size = (item.size || '-').padEnd(8);
        const qty = String(item.quantity).padEnd(10);
        const price = String(item.unitPrice).padEnd(18);
        const total = item.unitPrice * item.quantity;
        subtotal += total;
        doc.text(`${name}${size}${qty}${price}${total}`, { align: 'center' });
      }
      doc.moveDown();
      // Subtotal, VAT, Grand Total
      doc.text(`Subtotal:`.padEnd(57) + `${subtotal}`, { align: 'center' });
      const vat = Math.round(subtotal * 0.04);
      doc.text(`VAT (4%):`.padEnd(57) + `${vat}`, { align: 'center' });
      doc.text(`Grand Total:`.padEnd(57) + `${subtotal + vat}`, { align: 'center' });
      doc.moveDown();
      doc.font('Courier-Oblique').fontSize(11).text('Powered by ZeroFlow', { align: 'center' });
      doc.end();
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
