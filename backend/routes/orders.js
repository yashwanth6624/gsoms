const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Helper to wrap SQLite commands in a transaction sequentially (serialized queue)
let transactionQueue = Promise.resolve();

const runTransaction = async (callback) => {
  return new Promise((resolve, reject) => {
    transactionQueue = transactionQueue.then(async () => {
      try {
        await run('BEGIN IMMEDIATE TRANSACTION');
        try {
          const result = await callback();
          await run('COMMIT');
          resolve(result);
        } catch (error) {
          try {
            await run('ROLLBACK');
          } catch (rollbackErr) {
            console.error('Failed to rollback transaction:', rollbackErr);
          }
          reject(error);
        }
      } catch (beginError) {
        reject(beginError);
      }
    }).catch((queueErr) => {
      console.error('Unhandled queue error:', queueErr);
    });
  });
};

// POST /api/orders - Create a new order (Customer only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.id;
    const { delivery_address, notes, items } = req.body;

    if (!delivery_address) {
      return res.status(400).json({ error: 'Delivery address is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Process order inside a transaction to validate stocks and save
    const orderId = await runTransaction(async () => {
      // 1. Aggregate requested quantities by product_id to validate correctly
      const productTotals = {};
      for (const item of items) {
        const { product_id, quantity } = item;
        const qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for product ID ${product_id}`);
        }
        productTotals[product_id] = (productTotals[product_id] || 0) + qty;
      }

      // 2. Validate stocks on aggregated totals
      for (const productId of Object.keys(productTotals)) {
        const qtyRequested = productTotals[productId];
        const product = await get(`
          SELECT p.name, COALESCE(s.available_qty, 0) AS available_qty
          FROM products p
          LEFT JOIN warehouse_stock s ON p.id = s.product_id
          WHERE p.id = ?
        `, [productId]);

        if (!product) {
          throw new Error(`Product with ID ${productId} does not exist`);
        }

        if (product.available_qty < qtyRequested) {
          throw new Error(`Insufficient stock for product "${product.name}". Available: ${product.available_qty}, Requested: ${qtyRequested}`);
        }
      }

      // 3. Create order row
      const orderResult = await run(
        `INSERT INTO orders (customer_id, status, delivery_address, notes) VALUES (?, 'pending', ?, ?)`,
        [customerId, delivery_address, notes || '']
      );
      const newOrderId = orderResult.id;

      // 4. Create items and copy prices
      for (const item of items) {
        const { product_id, quantity } = item;
        const qty = parseInt(quantity, 10);

        const product = await get('SELECT price FROM products WHERE id = ?', [product_id]);
        await run(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
          [newOrderId, product_id, qty, product.price]
        );
      }

      // 4. Write initial status history
      await run(
        `INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, 'pending', ?)`,
        [newOrderId, customerId]
      );

      return newOrderId;
    });

    res.status(201).json({
      message: 'Order created successfully',
      orderId
    });
  } catch (error) {
    console.error('Create order error:', error.message);
    res.status(400).json({ error: error.message || 'Server error creating order' });
  }
});

// GET /api/orders - List orders with filters (Admin sees all; Customer sees their own)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const isClientAdmin = req.user.role === 'admin';
    const { status, start_date, end_date, customer } = req.query;

    let sql = `
      SELECT o.id, o.customer_id, o.status, o.order_date, o.delivery_address, o.notes, o.created_at, o.updated_at,
             u.name AS customer_name, u.email AS customer_email,
             (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id) AS total_amount,
             (SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id) AS total_items
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by customer if not admin, or admin specified a filter
    if (!isClientAdmin) {
      sql += ` AND o.customer_id = ?`;
      params.push(userId);
    } else if (customer) {
      sql += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${customer}%`, `%${customer}%`);
    }

    if (status) {
      sql += ` AND o.status = ?`;
      params.push(status);
    }

    if (start_date) {
      sql += ` AND o.order_date >= ?`;
      params.push(start_date);
    }

    if (end_date) {
      sql += ` AND o.order_date <= ?`;
      params.push(end_date);
    }

    sql += ` ORDER BY o.order_date DESC`;

    const orders = await query(sql, params);
    res.json(orders);
  } catch (error) {
    console.error('List orders error:', error);
    res.status(500).json({ error: 'Server error listing orders' });
  }
});

// GET /api/orders/:id - Detail view (items + status history)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    const isClientAdmin = req.user.role === 'admin';

    // 1. Get order details
    const order = await get(`
      SELECT o.id, o.customer_id, o.status, o.order_date, o.delivery_address, o.notes, o.created_at, o.updated_at,
             u.name AS customer_name, u.email AS customer_email,
             (SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id) AS total_amount
      FROM orders o
      JOIN users u ON o.customer_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Safety: customer can only view their own order
    if (!isClientAdmin && order.customer_id !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied' });
    }

    // 2. Get order items
    const items = await query(`
      SELECT oi.id, oi.product_id, oi.quantity, oi.unit_price,
             p.name AS product_name, p.sku AS product_sku, p.unit AS product_unit
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // 3. Get status history
    const history = await query(`
      SELECT osh.id, osh.status, osh.changed_at,
             u.name AS changed_by_name, u.role AS changed_by_role
      FROM order_status_history osh
      JOIN users u ON osh.changed_by = u.id
      WHERE osh.order_id = ?
      ORDER BY osh.changed_at ASC
    `, [orderId]);

    res.json({
      order,
      items,
      history
    });
  } catch (error) {
    console.error('Fetch order detail error:', error);
    res.status(500).json({ error: 'Server error fetching order details' });
  }
});

// PATCH /api/orders/:id/status - Update order status (Admin only)
// Status sequence: pending -> confirmed -> dispatched -> delivered
router.patch('/:id/status', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['pending', 'confirmed', 'dispatched', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid target status' });
    }

    // Fetch current order status
    const order = await get('SELECT id, status, customer_id FROM orders WHERE id = ?', [orderId]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const currentStatus = order.status;

    // Check strict transition path
    if (status === 'confirmed') {
      if (currentStatus !== 'pending') {
        return res.status(400).json({ error: `Cannot transition status from "${currentStatus}" to "confirmed". Order must be in "pending" status.` });
      }
    } else if (status === 'dispatched') {
      if (currentStatus !== 'confirmed') {
        return res.status(400).json({ error: `Cannot transition status from "${currentStatus}" to "dispatched". Order must be in "confirmed" status.` });
      }
    } else if (status === 'delivered') {
      if (currentStatus !== 'dispatched') {
        return res.status(400).json({ error: `Cannot transition status from "${currentStatus}" to "delivered". Order must be in "dispatched" status.` });
      }
    } else if (status === 'pending') {
      return res.status(400).json({ error: 'Cannot transition order status back to pending.' });
    }

    // Execute state changes inside a transaction
    await runTransaction(async () => {
      // 1. If transitioning to CONFIRMED, validate & deduct stock, and generate invoice
      if (status === 'confirmed') {
        // Fetch all items
        const items = await query('SELECT product_id, quantity, unit_price FROM order_items WHERE order_id = ?', [orderId]);
        
        // Aggregate quantities by product_id to validate correctly
        const productTotals = {};
        for (const item of items) {
          productTotals[item.product_id] = (productTotals[item.product_id] || 0) + item.quantity;
        }

        // Validate stock availability on aggregated totals
        for (const productId of Object.keys(productTotals)) {
          const qtyRequested = productTotals[productId];
          const stock = await get('SELECT available_qty FROM warehouse_stock WHERE product_id = ?', [productId]);
          const available = stock ? stock.available_qty : 0;
          if (available < qtyRequested) {
            const prod = await get('SELECT name FROM products WHERE id = ?', [productId]);
            throw new Error(`Insufficient warehouse stock for product "${prod.name}" to confirm order. Available: ${available}, Required: ${qtyRequested}`);
          }
        }

        // Deduct stock
        for (const item of items) {
          await run(
            'UPDATE warehouse_stock SET available_qty = available_qty - ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?',
            [item.quantity, item.product_id]
          );
        }

        // Auto-generate invoice
        const totalAmountResult = await get('SELECT SUM(quantity * unit_price) AS total FROM order_items WHERE order_id = ?', [orderId]);
        const totalAmount = totalAmountResult ? totalAmountResult.total : 0;
        
        // Generate sequential invoice number: INV-2026-[orderId]
        const invoiceNum = `INV-2026-${orderId.toString().padStart(4, '0')}`;
        
        // Save to invoices table
        await run(
          'INSERT INTO invoices (order_id, invoice_number, total_amount) VALUES (?, ?, ?)',
          [orderId, invoiceNum, totalAmount]
        );
      }

      // 2. Update status in orders table
      await run(
        'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [status, orderId]
      );

      // 3. Write status history log
      await run(
        'INSERT INTO order_status_history (order_id, status, changed_by) VALUES (?, ?, ?)',
        [orderId, status, userId]
      );
    });

    res.json({
      message: `Order status updated to "${status}" successfully.`,
      status
    });
  } catch (error) {
    console.error('Update status error:', error.message);
    res.status(400).json({ error: error.message || 'Server error updating status' });
  }
});

module.exports = router;
