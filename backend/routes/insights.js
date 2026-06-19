const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/insights (Admin only)
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // 1. Pending orders > 2 days old
    // In SQLite, datetime('now') returns UTC. Let's check order_date <= datetime('now', '-2 days')
    const pendingOrdersOld = await query(`
      SELECT o.id, o.order_date, o.delivery_address, o.notes, u.name AS customer_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
        AND o.order_date <= datetime('now', '-2 days')
      ORDER BY o.order_date ASC
    `);

    // 2. Top 3 products by order count this week (last 7 days)
    const topProducts = await query(`
      SELECT p.id, p.name, p.sku, p.unit, p.price,
             COUNT(oi.id) AS order_count,
             SUM(oi.quantity) AS total_quantity
      FROM products p
      JOIN order_items oi ON p.id = oi.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_date >= datetime('now', '-7 days')
      GROUP BY p.id
      ORDER BY order_count DESC, total_quantity DESC
      LIMIT 3
    `);

    // 3. Products below low-stock threshold (threshold = 10 units)
    const lowStockProducts = await query(`
      SELECT p.id, p.name, p.sku, p.unit, p.price,
             COALESCE(s.available_qty, 0) AS available_qty
      FROM products p
      LEFT JOIN warehouse_stock s ON p.id = s.product_id
      WHERE COALESCE(s.available_qty, 0) < 10
      ORDER BY available_qty ASC, p.name ASC
    `);

    res.json({
      pendingOrdersOld,
      topProducts,
      lowStockProducts,
      threshold: 10
    });
  } catch (error) {
    console.error('Fetch insights error:', error);
    res.status(500).json({ error: 'Server error generating insights' });
  }
});

module.exports = router;
