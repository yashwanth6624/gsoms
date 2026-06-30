import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency, formatLocalDateTime, formatLocalDate } from '../utils';

const OrderDetail = ({ orderId, user, setActivePage, setSelectedOrderId, showToast }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const isAdmin = user.role === 'admin';

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setError('');
      const response = await api.getOrderById(orderId);
      setData(response);
    } catch (err) {
      setError(`Failed to fetch order details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (targetStatus) => {
    setActionError('');
    try {
      await api.updateOrderStatus(orderId, targetStatus);
      if (showToast) {
        showToast(`Order status updated to "${targetStatus}" successfully.`, 'success');
      }
      fetchOrderDetail(); // Refresh detail page data
    } catch (err) {
      setActionError(`Transition failed: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center" style={{ padding: '3rem' }}>
        <h3 className="text-danger">{error || 'Order not found'}</h3>
        <button className="btn btn-secondary mt-4" onClick={() => setActivePage('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { order, items, history } = data;

  // Map history to timeline stages
  const stages = [
    { key: 'pending', label: 'Placed (Pending)' },
    { key: 'confirmed', label: 'Confirmed & Stock Deducted' },
    { key: 'dispatched', label: 'Dispatched for Delivery' },
    { key: 'delivered', label: 'Delivered successfully' }
  ];

  const getHistoryForStatus = (statusKey) => {
    return history.find(h => h.status === statusKey);
  };

  return (
    <div className="flex-col">
      <div className="page-header">
        <div className="flex align-center gap-2">
          <button className="btn btn-secondary" onClick={() => setActivePage('dashboard')}>
            ← Back
          </button>
          <h1 className="page-title">Order Details #{order.id}</h1>
        </div>
        <div className="flex gap-1">
          {order.status !== 'pending' && (
            <button
              onClick={() => {
                setSelectedOrderId(order.id);
                setActivePage('invoice-preview');
              }}
              className="btn btn-success"
            >
              View Invoice Document
            </button>
          )}
        </div>
      </div>

      {actionError && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{actionError}</span>
        </div>
      )}

      <div className="grid-2">
        {/* Left side: details and items */}
        <div className="flex-col">
          {/* Summary Information */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Order Overview</h2>
              <StatusBadge status={order.status} />
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Customer Name</span>
                  <p style={{ fontWeight: 600 }}>{order.customer_name}</p>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Email Address</span>
                  <p>{order.customer_email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Order Date</span>
                  <p>{formatLocalDateTime(order.order_date)}</p>
                </div>
                <div>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Delivery Address</span>
                  <p style={{ fontWeight: 500 }}>{order.delivery_address}</p>
                </div>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>Special Notes</span>
                <p style={{ fontStyle: order.notes ? 'normal' : 'italic', color: order.notes ? 'var(--text-dark)' : 'var(--secondary-color)' }}>
                  {order.notes || 'No special delivery instructions provided.'}
                </p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Ordered Items</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                      <th>Unit Price</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 500 }}>{item.product_name}</div>
                        </td>
                        <td>
                          <code style={{ fontSize: '0.85rem' }}>{item.product_sku}</code>
                        </td>
                        <td>{item.quantity} {item.product_unit}</td>
                        <td>{formatCurrency(item.unit_price)}</td>
                        <td style={{ fontWeight: 600, textAlign: 'right' }}>
                          {formatCurrency(item.quantity * item.unit_price)}
                        </td>
                      </tr>
                    ))}
                    <tr style={{ backgroundColor: '#FAFAFA' }}>
                      <td colSpan="3" style={{ borderBottom: 'none' }}></td>
                      <td style={{ fontWeight: 700, borderBottom: 'none' }}>Total Amount:</td>
                      <td style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary-color)', textAlign: 'right', borderBottom: 'none' }}>
                        {formatCurrency(order.total_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: status timeline and quick actions */}
        <div className="flex-col">
          {/* Quick Actions for Admin */}
          {isAdmin && order.status !== 'delivered' && (
            <div className="card mb-4" style={{ borderTop: '4px solid var(--primary-color)' }}>
              <div className="card-header">
                <h2 className="card-title">Manage Workflow</h2>
              </div>
              <div className="card-body">
                <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
                  Update the status of this supply request to progress it through the pipeline.
                </p>
                <div className="flex flex-col gap-2">
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleStatusTransition('confirmed')}
                      className="btn btn-success"
                      style={{ width: '100%' }}
                    >
                      Confirm Order & Deduct Stock
                    </button>
                  )}
                  {order.status === 'confirmed' && (
                    <button
                      onClick={() => handleStatusTransition('dispatched')}
                      className="btn btn-warning"
                      style={{ width: '100%' }}
                    >
                      Dispatch Order for Delivery
                    </button>
                  )}
                  {order.status === 'dispatched' && (
                    <button
                      onClick={() => handleStatusTransition('delivered')}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      Mark as Delivered
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Vertical Timeline */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Supply Timeline</h2>
            </div>
            <div className="card-body">
              <div className="timeline">
                {stages.map((stage, idx) => {
                  const log = getHistoryForStatus(stage.key);
                  const isCompleted = !!log;
                  const isActive = stage.key === order.status;
                                    return (
                    <div key={stage.key} className={`timeline-item ${isCompleted ? 'completed' : ''}`}>
                      <div className={`timeline-dot ${isCompleted ? 'active' : ''} ${isActive ? 'pulse' : ''}`}></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span
                            className="timeline-title"
                            style={{
                              color: isCompleted ? 'var(--text-dark)' : 'var(--secondary-color)',
                              fontWeight: isCompleted ? 600 : 400
                            }}
                          >
                            {stage.label}
                          </span>
                        </div>
                        {isCompleted ? (
                          <>
                            <span className="timeline-time">
                              {formatLocalDateTime(log.changed_at)}
                            </span>
                            <span className="timeline-author">
                              By: <strong>{log.changed_by_name}</strong> ({log.changed_by_role})
                            </span>
                          </>
                        ) : (
                          <span className="timeline-time text-muted" style={{ fontStyle: 'italic' }}>
                            Awaiting stage...
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
