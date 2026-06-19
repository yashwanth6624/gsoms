const express = require('express');
const router = express.Router();
const { get, query } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/invoices/:orderId
router.get('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;
    const isClientAdmin = req.user.role === 'admin';

    // 1. Get order details to check ownership
    const order = await get(`
      SELECT o.id, o.customer_id, o.order_date, o.delivery_address, o.notes,
             u.name AS customer_name, u.email AS customer_email
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Safety: check ownership if user is customer
    if (!isClientAdmin && order.customer_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // 2. Fetch invoice details
    const invoice = await get(`
      SELECT id, invoice_number, total_amount, generated_at
      FROM invoices
      WHERE order_id = ?
    `, [orderId]);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found. Invoice is generated once order is confirmed.' });
    }

    // 3. Fetch order items for the invoice printout
    const items = await query(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
             p.name AS product_name, p.sku AS product_sku, p.unit AS product_unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    res.json({
      invoice,
      order,
      items
    });
  } catch (error) {
    console.error('Fetch invoice error:', error);
    res.status(500).json({ error: 'Server error fetching invoice data' });
  }
});

module.exports = router;
