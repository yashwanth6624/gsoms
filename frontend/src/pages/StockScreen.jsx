import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils';

const StockScreen = ({ user, setActivePage, showToast }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Track editing product object and current value
  const [editingProduct, setEditingProduct] = useState(null);
  const [editQty, setEditQty] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Forbidden: Admin access required.');
      setLoading(false);
      return;
    }
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setError('');
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch warehouse stock levels.');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (product) => {
    setEditingProduct(product);
    setEditQty(product.available_qty.toString());
    setSuccessMsg('');
    setError('');
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setEditQty('');
  };

  const saveStockUpdate = async (productId) => {
    setError('');
    setSuccessMsg('');
    const qty = parseInt(editQty, 10);
    
    if (isNaN(qty) || qty < 0) {
      setError('Stock quantity must be a non-negative integer.');
      return;
    }

    try {
      await api.updateProductStock(productId, qty);
      if (showToast) {
        showToast(`Stock updated for ${editingProduct.name} to ${qty} ${editingProduct.unit}.`, 'success');
      }
      setSuccessMsg('Stock level adjusted successfully.');
      setEditingProduct(null);
      fetchProducts(); // Refresh list
    } catch (err) {
      setError(`Failed to update stock: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error && !isAdmin) {
    return (
      <div className="card text-center text-danger" style={{ padding: '3rem' }}>
        <h3>{error}</h3>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="page-header">
        <h1 className="page-title">Warehouse Stock Control</h1>
        <span className="text-muted">Threshold: Alerts active for stock &lt; 10 units</span>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-delivered)', backgroundColor: '#F0FDF4', padding: '0.75rem 1rem' }}>
          <span className="text-success" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{successMsg}</span>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Inventory Ledger</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--secondary-color)' }}>
            Total Catalog Products: {products.length}
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {products.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>
              <h3>No products found in the warehouse stock ledger</h3>
              <p className="mt-2">Ensure the catalog is seeded or add products to the database.</p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    <th>SKU Code</th>
                    <th>Sales Price</th>
                    <th>Unit Size</th>
                    <th>Available Stock</th>
                    <th>Stock Alert Status</th>
                    <th style={{ textAlign: 'right' }}>Action Control</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(product => {
                    const isLowStock = product.available_qty < 10;
                    
                    return (
                      <tr
                        key={product.id}
                        style={{
                          backgroundColor: isLowStock ? '#FEF2F2' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        <td style={{ fontWeight: 600 }}>#{product.id}</td>
                        <td style={{ fontWeight: 500, color: isLowStock ? '#991B1B' : 'inherit' }}>
                          {product.name}
                        </td>
                        <td>
                          <code style={{ color: isLowStock ? '#991B1B' : 'inherit' }}>{product.sku}</code>
                        </td>
                        <td style={{ fontWeight: 600 }}>{formatCurrency(product.price)}</td>
                        <td>{product.unit}</td>
                        <td>
                          <span style={{ fontSize: '1.1rem', fontWeight: 700, color: isLowStock ? 'var(--color-error)' : 'inherit' }}>
                            {product.available_qty}
                          </span>
                        </td>
                        <td>
                          <StatusBadge status={isLowStock ? 'Low' : 'Good'} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => startEditing(product)}
                            className="btn btn-primary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            Update Stock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Centered Stock Adjustment Modal (PART 1 - Issue 2) */}
      {editingProduct && (
        <div className="modal-backdrop" onClick={cancelEditing}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={cancelEditing} aria-label="Close modal">✕</button>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 className="modal-title">{editingProduct.name}</h2>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>SKU: {editingProduct.sku}</span>
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-dark)', marginBottom: '0.75rem' }}>
                Current Stock: <strong style={{ color: 'var(--primary-color)' }}>{editingProduct.available_qty} {editingProduct.unit}</strong>
              </p>
              <label className="form-label" htmlFor="new-stock-qty" style={{ fontWeight: 600 }}>New Stock Quantity</label>
              <input
                id="new-stock-qty"
                type="number"
                className="form-input"
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
                min="0"
                required
                autoFocus
              />
            </div>

            <div className="flex gap-1" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={cancelEditing}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => saveStockUpdate(editingProduct.id)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockScreen;
