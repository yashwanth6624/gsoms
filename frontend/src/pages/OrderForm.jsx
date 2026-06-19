import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { formatCurrency } from '../utils';

const OrderForm = ({ setActivePage, setSelectedOrderId, showToast }) => {
  const [products, setProducts] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Array of items: { product_id, quantity, sku, price, unit, maxStock }
  const [items, setItems] = useState([{ product_id: '', quantity: 1, sku: '', price: 0, unit: '', maxStock: 0 }]);
  
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  const [error, setError] = useState('');
  const [successOrder, setSuccessOrder] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch (err) {
      setError('Failed to fetch products list. Please reload.');
    } finally {
      setFetchingProducts(false);
    }
  };

  const handleItemProductChange = (index, productId) => {
    const selectedProduct = products.find(p => p.id === parseInt(productId, 10));
    const newItems = [...items];
    
    if (selectedProduct) {
      newItems[index] = {
        product_id: productId,
        quantity: 1,
        sku: selectedProduct.sku,
        price: selectedProduct.price,
        unit: selectedProduct.unit,
        maxStock: selectedProduct.available_qty
      };
    } else {
      newItems[index] = { product_id: '', quantity: 1, sku: '', price: 0, unit: '', maxStock: 0 };
    }
    setItems(newItems);
    setError('');
  };

  const handleItemQtyChange = (index, value) => {
    const newItems = [...items];
    const qty = parseInt(value, 10);
    newItems[index].quantity = isNaN(qty) ? '' : qty;
    setItems(newItems);
    setError('');
  };

  const addItemRow = () => {
    setItems([...items, { product_id: '', quantity: 1, sku: '', price: 0, unit: '', maxStock: 0 }]);
  };

  const removeItemRow = (index) => {
    if (items.length === 1) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.price * (item.quantity || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!deliveryAddress.trim()) {
      setError('Delivery address is required.');
      return;
    }

    const filteredItems = items.filter(item => item.product_id !== '');
    if (filteredItems.length === 0) {
      setError('Please add at least one product to your order.');
      return;
    }

    // Validate quantities and stock levels
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_id) continue;
      
      if (!item.quantity || item.quantity <= 0) {
        setError(`Please specify a valid quantity for item ${i + 1}.`);
        return;
      }

      if (item.quantity > item.maxStock) {
        setError(`Insufficient warehouse stock for item ${i + 1} (${products.find(p => p.id === parseInt(item.product_id, 10))?.name}). Available: ${item.maxStock}, Requested: ${item.quantity}`);
        return;
      }
    }

    setLoading(true);
    try {
      const payloadItems = filteredItems.map(item => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity
      }));

      const response = await api.createOrder(deliveryAddress, notes, payloadItems);
      if (showToast) {
        showToast(`Order #${response.orderId} placed successfully!`, 'success');
      }
      setSuccessOrder({
        id: response.orderId,
        address: deliveryAddress,
        itemsCount: payloadItems.length,
        total: calculateTotal()
      });
      // Clear fields
      setDeliveryAddress('');
      setNotes('');
      setItems([{ product_id: '', quantity: 1, sku: '', price: 0, unit: '', maxStock: 0 }]);
    } catch (err) {
      setError(err.message || 'Server error creating order');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProducts) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (successOrder) {
    return (
      <div className="card text-center" style={{ maxWidth: '600px', margin: '3rem auto', padding: '3rem' }}>
        <div style={{ color: 'var(--color-delivered)', fontSize: '4rem', marginBottom: '1.5rem' }}>✔</div>
        <h2 className="mb-2" style={{ color: 'var(--primary-color)', fontWeight: 700 }}>Order Placed Successfully!</h2>
        <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
          Thank you for your order. Your supply request has been queued in the system.
        </p>
        
        <div className="card mb-4" style={{ backgroundColor: '#F8FAFC', padding: '1.5rem', textAlign: 'left', border: '1px solid var(--border-color)' }}>
          <div className="flex justify-between mb-2">
            <span style={{ fontWeight: 600 }}>Order ID:</span>
            <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>#{successOrder.id}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span style={{ fontWeight: 600 }}>Total Items:</span>
            <span>{successOrder.itemsCount} products</span>
          </div>
          <div className="flex justify-between mb-2">
            <span style={{ fontWeight: 600 }}>Total Amount:</span>
            <span style={{ fontWeight: 700, color: 'var(--color-delivered)' }}>{formatCurrency(successOrder.total)}</span>
          </div>
          <div className="flex flex-col mb-2">
            <span style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Delivery Address:</span>
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>{successOrder.address}</span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button
            onClick={() => {
              setSelectedOrderId(successOrder.id);
              setActivePage('order-detail');
            }}
            className="btn btn-primary flex-1"
          >
            Track Order
          </button>
          <button
            onClick={() => setSuccessOrder(null)}
            className="btn btn-secondary flex-1"
          >
            Place New Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="page-header">
        <h1 className="page-title">Place Goods Supply Order</h1>
        <button className="btn btn-secondary" onClick={() => setActivePage('dashboard')}>Cancel</button>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="form-group flex-1">
            <label className="form-label" htmlFor="order-address">Delivery Address *</label>
            <input
              id="order-address"
              type="text"
              className="form-input"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Full shop/warehouse delivery address"
              required
            />
          </div>
          <div className="form-group flex-1">
            <label className="form-label" htmlFor="order-notes">Order Notes (Optional)</label>
            <input
              id="order-notes"
              type="text"
              className="form-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deliver after 2 PM, Call on arrival"
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Order Items</h2>
            <button
              type="button"
              onClick={addItemRow}
              className="btn btn-secondary"
              style={{ padding: '0.375rem 0.75rem', fontSize: '0.85rem' }}
            >
              + Add Product
            </button>
          </div>
          <div className="card-body">
            {items.map((item, index) => (
              <div key={index} className="order-item-row">
                <div className="form-group flex-1" style={{ margin: 0 }}>
                  <label className="form-label" htmlFor={`prod-sel-${index}`}>Select Product *</label>
                  <select
                    id={`prod-sel-${index}`}
                    className="form-select"
                    value={item.product_id}
                    onChange={(e) => handleItemProductChange(index, e.target.value)}
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.available_qty <= 0}>
                        {p.name} (SKU: {p.sku}) — Avail: {p.available_qty} {p.unit}
                      </option>
                    ))}
                  </select>
                </div>

                {item.product_id && (
                  <>
                    <div style={{ width: '80px' }}>
                      <span className="form-label">SKU</span>
                      <div className="form-input" style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '0.85rem', color: '#64748B' }}>
                        {item.sku}
                      </div>
                    </div>
                    <div style={{ width: '90px' }}>
                      <span className="form-label">Price</span>
                      <div className="form-input" style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '0.85rem', color: '#64748B' }}>
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <div style={{ width: '80px' }}>
                      <span className="form-label">Unit</span>
                      <div className="form-input" style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', fontSize: '0.85rem', color: '#64748B', textAlign: 'center' }}>
                        {item.unit}
                      </div>
                    </div>
                  </>
                )}

                <div style={{ width: '100px' }}>
                  <label className="form-label" htmlFor={`prod-qty-${index}`}>Quantity *</label>
                  <input
                    id={`prod-qty-${index}`}
                    type="number"
                    min="1"
                    max={item.maxStock || undefined}
                    className={`form-input ${item.quantity > item.maxStock ? 'text-danger' : ''}`}
                    value={item.quantity}
                    onChange={(e) => handleItemQtyChange(index, e.target.value)}
                    required
                    disabled={!item.product_id}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeItemRow(index)}
                  className="btn btn-danger"
                  style={{ height: '38px', padding: '0.375rem 0.75rem' }}
                  disabled={items.length === 1}
                >
                  ✕
                </button>
              </div>
            ))}

            {/* Total summary */}
            <div className="flex justify-between align-center mt-4 pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
              <div>
                <span className="text-muted">Total Estimated Amount:</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)', marginLeft: '1rem' }}>
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '0.75rem 2rem' }}
                disabled={loading}
              >
                {loading ? 'Submitting Order...' : 'Submit Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
