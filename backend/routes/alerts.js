const express = require('express');
const router = express.Router();
const { query } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/alerts - Fetch active alerts for admin
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    // 1. Overdue Orders (Pending > 48 hours)
    const overdueOrders = await query(`
      SELECT o.id, o.order_date, u.name AS customer_name
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.status = 'pending'
        AND o.order_date <= datetime('now', '-2 days')
      ORDER BY o.order_date ASC
    `);

    // 2. Low Stock (Stock < 10)
    const lowStock = await query(`
      SELECT p.id, p.name, p.sku, p.unit, COALESCE(s.available_qty, 0) AS available_qty
      FROM products p
      LEFT JOIN warehouse_stock s ON p.id = s.product_id
      WHERE COALESCE(s.available_qty, 0) < 10
      ORDER BY available_qty ASC, p.name ASC
    `);

    // 3. Dispatch Pending (Confirmed > 24 hours ago)
    const dispatchPending = await query(`
      SELECT o.id, u.name AS customer_name, MAX(h.changed_at) AS confirmed_at
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      JOIN order_status_history h ON o.id = h.order_id
      WHERE o.status = 'confirmed'
        AND h.status = 'confirmed'
      GROUP BY o.id
      HAVING confirmed_at <= datetime('now', '-24 hours')
      ORDER BY confirmed_at ASC
    `);

    // 4. New Orders (Placed in last 30 minutes)
    const newOrders = await query(`
      SELECT o.id, u.name AS customer_name, o.order_date,
             (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS total_items,
             (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id) AS total_amount
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.order_date >= datetime('now', '-30 minutes')
      ORDER BY o.order_date DESC
    `);

    // Format all alerts into a priority-sorted array
    const alerts = [];

    // Type 2: Overdue Orders (Red border, Priority 1)
    overdueOrders.forEach(order => {
      // Calculate how many days ago it was placed
      const timeDiff = Math.max(0, new Date() - new Date(order.order_date.replace(' ', 'T') + 'Z'));
      const days = Math.round(timeDiff / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `overdue-${order.id}`,
        type: 'overdue_order',
        orderId: order.id,
        title: `Order Overdue: #${order.id}`,
        message: `Placed by ${order.customer_name} on ${new Date(order.order_date.replace(' ', 'T') + 'Z').toLocaleDateString()}. Awaiting confirmation for ${days || 2} days.`,
        priority: 1,
        color: 'red',
        action: 'confirm',
        data: { orderId: order.id }
      });
    });

    // Type 1: Low Stock (Orange border, Priority 2)
    lowStock.forEach(prod => {
      alerts.push({
        id: `lowstock-${prod.id}`,
        type: 'low_stock',
        productId: prod.id,
        title: `Low Stock: ${prod.name}`,
        message: `Only ${prod.available_qty} ${prod.unit} remaining. Update stock immediately.`,
        priority: 2,
        color: 'orange',
        action: 'update_stock',
        data: { productId: prod.id, name: prod.name, available_qty: prod.available_qty, unit: prod.unit, sku: prod.sku }
      });
    });

    // Type 4: Dispatch Pending (Blue border, Priority 3)
    dispatchPending.forEach(order => {
      const timeDiff = Math.max(0, new Date() - new Date(order.confirmed_at.replace(' ', 'T') + 'Z'));
      const hours = Math.round(timeDiff / (1000 * 60 * 60));
      alerts.push({
        id: `dispatch-${order.id}`,
        type: 'dispatch_pending',
        orderId: order.id,
        title: `Dispatch Pending: #${order.id}`,
        message: `Confirmed ${hours || 24} hours ago. Ready to dispatch.`,
        priority: 3,
        color: 'blue',
        action: 'dispatch',
        data: { orderId: order.id }
      });
    });

    // Type 3: New Orders (Green border, Priority 4)
    newOrders.forEach(order => {
      alerts.push({
        id: `neworder-${order.id}`,
        type: 'new_order',
        orderId: order.id,
        title: `New Order: #${order.id}`,
        message: `Placed by ${order.customer_name} — ${order.total_items || 0} items, ₹${order.total_amount || 0}`,
        priority: 4,
        color: 'green',
        action: 'view',
        data: { orderId: order.id }
      });
    });

    // Sort by priority (1 to 4)
    alerts.sort((a, b) => a.priority - b.priority);

    res.json(alerts);
  } catch (error) {
    console.error('Fetch alerts error:', error);
    res.status(500).json({ error: 'Server error generating live alerts' });
  }
});

module.exports = router;
