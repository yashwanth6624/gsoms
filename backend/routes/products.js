const express = require('express');
const router = express.Router();
const { query, get, run } = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET /api/products - list all products with stock levels
// Authenticated route (either Admin or Customer)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await query(`
      SELECT p.id, p.name, p.sku, p.unit, p.price, p.created_at,
             COALESCE(s.available_qty, 0) AS available_qty
      FROM products p
      LEFT JOIN warehouse_stock s ON p.id = s.product_id
      ORDER BY p.name ASC
    `);
    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

// PATCH /api/products/:id/stock - update warehouse stock (Admin only)
router.patch('/:id/stock', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const productId = req.params.id;
    const { available_qty } = req.body;

    if (available_qty === undefined || available_qty === null) {
      return res.status(400).json({ error: 'available_qty is required' });
    }

    const qty = parseInt(available_qty, 10);
    if (isNaN(qty) || qty < 0) {
      return res.status(400).json({ error: 'available_qty must be a non-negative integer' });
    }

    // Verify product exists
    const product = await get('SELECT id FROM products WHERE id = ?', [productId]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if stock entry exists, if not create, else update
    const stock = await get('SELECT id FROM warehouse_stock WHERE product_id = ?', [productId]);
    if (stock) {
      await run(
        'UPDATE warehouse_stock SET available_qty = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?',
        [qty, productId]
      );
    } else {
      await run(
        'INSERT INTO warehouse_stock (product_id, available_qty) VALUES (?, ?)',
        [productId, qty]
      );
    }

    // Fetch and return the updated stock row
    const updatedProduct = await get(`
      SELECT p.id, p.name, p.sku, p.unit, p.price, COALESCE(s.available_qty, 0) AS available_qty
      FROM products p
      LEFT JOIN warehouse_stock s ON p.id = s.product_id
      WHERE p.id = ?
    `, [productId]);

    res.json({
      message: 'Stock updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Server error updating stock' });
  }
});

module.exports = router;
