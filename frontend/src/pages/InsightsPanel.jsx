import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { formatCurrency, formatLocalDate } from '../utils';

const InsightsPanel = ({ user, setActivePage }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    if (!isAdmin) {
      setError('Forbidden: Admin access required.');
      setLoading(false);
      return;
    }
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setError('');
      const data = await api.getInsights();
      setInsights(data);
    } catch (err) {
      setError('Failed to fetch business insights data.');
    } finally {
      setLoading(false);
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

  const { pendingOrdersOld, topProducts, lowStockProducts, threshold } = insights;

  return (
    <div className="flex-col">
      <div className="page-header">
        <h1 className="page-title">Executive Business Insights</h1>
        <button onClick={fetchInsights} className="btn btn-secondary">🔄 Refresh Metrics</button>
      </div>

      {error && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* Grid of core metrics */}
      <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: '1fr 1fr', alignItems: 'stretch' }}>
        
        {/* Card 1: Pending Orders Alert */}
        <div className="card flex-col" style={{ borderTop: `4px solid ${pendingOrdersOld.length > 0 ? 'var(--color-pending)' : 'var(--color-delivered)'}` }}>
          <div className="card-header">
            <h2 className="card-title">Pending Orders Backlog (&gt; 2 Days Old)</h2>
            <span className={`badge ${pendingOrdersOld.length > 0 ? 'badge-pending' : 'badge-delivered'}`}>
              {pendingOrdersOld.length} Delayed
            </span>
          </div>
          <div className="card-body flex-1">
            {pendingOrdersOld.length > 0 ? (
              <>
                <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-pending)', backgroundColor: '#FFFBEB', padding: '0.75rem 1rem' }}>
                  <span style={{ color: '#B45309', fontSize: '0.85rem', fontWeight: 600 }}>
                    ⚠️ Warning: The following orders have been in "Pending" status for more than 48 hours. Please review stock availability and confirm them.
                  </span>
                </div>
                <div className="table-container" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Date Placed</th>
                        <th>Customer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingOrdersOld.map(order => (
                        <tr key={order.id}>
                          <td><strong>#{order.id}</strong></td>
                          <td>{formatLocalDate(order.order_date, { dateStyle: 'short' })}</td>
                          <td>{order.customer_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center" style={{ padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3rem' }}>🎉</span>
                <h3 className="text-success mt-2">All Pending Orders are Fresh</h3>
                <p className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  No customer orders have been stuck in the Pending stage for more than 2 days.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Low Stock Warnings */}
        <div className="card flex-col" style={{ borderTop: `4px solid ${lowStockProducts.length > 0 ? 'var(--color-error)' : 'var(--color-delivered)'}` }}>
          <div className="card-header">
            <h2 className="card-title">Low Stock Warnings (Stock &lt; {threshold})</h2>
            <span className={`badge ${lowStockProducts.length > 0 ? 'badge-low-stock' : 'badge-delivered'}`}>
              {lowStockProducts.length} Items Low
            </span>
          </div>
          <div className="card-body flex-1 flex-col justify-between">
            {lowStockProducts.length > 0 ? (
              <>
                <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
                  <span className="text-danger" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    🚨 Replenishment Required: The products below have fallen below the critical stock threshold of {threshold} units.
                  </span>
                </div>
                <div className="table-container mb-4" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  <table className="table" style={{ fontSize: '0.85rem' }}>
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>SKU</th>
                        <th>Stock Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map(prod => (
                        <tr key={prod.id}>
                          <td><strong>{prod.name}</strong></td>
                          <td><code>{prod.sku}</code></td>
                          <td style={{ color: 'var(--color-error)', fontWeight: 700 }}>
                            {prod.available_qty} {prod.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center" style={{ padding: '2rem 1rem' }}>
                <span style={{ fontSize: '3rem' }}>📦</span>
                <h3 className="text-success mt-2">Inventory Levels Healthy</h3>
                <p className="text-muted mt-1" style={{ fontSize: '0.85rem' }}>
                  All catalog products currently meet or exceed the minimum stock safety margin.
                </p>
              </div>
            )}

            <button
              onClick={() => setActivePage('stock')}
              className="btn btn-secondary"
              style={{ width: '100%' }}
            >
              Go to Stock Control Room
            </button>
          </div>
        </div>

      </div>

      {/* Card 3: Top Products this week */}
      <div className="card mt-4" style={{ borderTop: '4px solid var(--primary-color)' }}>
        <div className="card-header">
          <h2 className="card-title">Top 3 Products by Order Frequency This Week (Last 7 Days)</h2>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Updated just now</span>
        </div>
        <div className="card-body">
          {topProducts.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '2rem' }}>
              <h3>No products ordered in the last 7 days</h3>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              {topProducts.map((prod, index) => {
                let badgeColor = '#94A3B8'; // Bronze/Gray
                if (index === 0) badgeColor = '#F59E0B'; // Gold
                if (index === 1) badgeColor = '#CBD5E1'; // Silver
                
                return (
                  <div
                    key={prod.id}
                    className="card"
                    style={{
                      borderLeft: `5px solid ${badgeColor}`,
                      backgroundColor: '#FAFAFA',
                      margin: 0,
                      padding: '1.25rem'
                    }}
                  >
                    <div className="flex justify-between align-center mb-2">
                      <span style={{ fontSize: '1.5rem', fontWeight: 800, color: badgeColor }}>
                        Rank #{index + 1}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                      {prod.name}
                    </h3>
                    <div className="mt-2 pt-2 text-muted" style={{ fontSize: '0.85rem' }}>
                      <div><strong>SKU:</strong> {prod.sku}</div>
                      <div><strong>Price:</strong> {formatCurrency(prod.price)}</div>
                    </div>
                    <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--border-color)', fontSize: '0.9rem' }}>
                      Total Quantity Ordered: <strong>{prod.total_quantity} {prod.unit}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsPanel;
