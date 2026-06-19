import React, { useState, useEffect } from 'react';
import { api } from '../api';
import StatusBadge from '../components/StatusBadge';
import { formatCurrency } from '../utils';

const Dashboard = ({ user, setActivePage, setSelectedOrderId, showToast }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  
  // Filter and search states
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const isAdmin = user.role === 'admin';
  const hasFilters = statusFilter || customerFilter || startDate || endDate;

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, customerFilter, startDate, endDate]);

  const fetchOrders = async () => {
    try {
      setError('');
      const filters = {};
      if (statusFilter) filters.status = statusFilter;
      if (customerFilter) filters.customer = customerFilter;
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;

      const data = await api.getOrders(filters);
      setOrders(data);
    } catch (err) {
      setError('Failed to fetch orders. Please refresh page.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusTransition = async (orderId, targetStatus) => {
    setActionError('');
    try {
      await api.updateOrderStatus(orderId, targetStatus);
      if (showToast) {
        showToast(`Order #${orderId} updated to "${targetStatus}" successfully.`, 'success');
      }
      fetchOrders(); // Refresh table and KPI counts
    } catch (err) {
      setActionError(`Action failed: ${err.message}`);
      window.scrollTo(0, 0); // Scroll to top to see error message
    }
  };

  // Calculate KPI metrics based on current fetched/filtered orders list
  const getKpis = () => {
    const kpis = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      dispatched: orders.filter(o => o.status === 'dispatched').length,
      delivered: orders.filter(o => o.status === 'delivered').length
    };
    return kpis;
  };

  const kpis = getKpis();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex-col">
      <div className="page-header">
        <h1 className="page-title">{isAdmin ? 'Admin Management Dashboard' : 'My Supply Orders'}</h1>
        {!isAdmin && (
          <button className="btn btn-primary" onClick={() => setActivePage('place-order')}>
            + Place New Order
          </button>
        )}
      </div>

      {actionError && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem', fontWeight: 600 }}>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="card mb-4" style={{ borderLeft: '4px solid var(--color-error)', backgroundColor: '#FEF2F2', padding: '0.75rem 1rem' }}>
          <span className="text-danger" style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* KPI Counters Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-border" style={{ backgroundColor: 'var(--primary-color)' }}></div>
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <span className="kpi-title" style={{ margin: 0 }}>Total Orders</span>
            <svg style={{ width: '20px', height: '20px', color: 'var(--secondary-color)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </div>
          <span className="kpi-value">{kpis.total}</span>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-border" style={{ backgroundColor: 'var(--color-pending)' }}></div>
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <span className="kpi-title" style={{ margin: 0 }}>Pending</span>
            <svg style={{ width: '20px', height: '20px', color: 'var(--color-pending)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span className="kpi-value">{kpis.pending}</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-border" style={{ backgroundColor: 'var(--color-confirmed)' }}></div>
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <span className="kpi-title" style={{ margin: 0 }}>Confirmed</span>
            <svg style={{ width: '20px', height: '20px', color: 'var(--color-confirmed)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <span className="kpi-value">{kpis.confirmed}</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-border" style={{ backgroundColor: 'var(--color-dispatched)' }}></div>
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <span className="kpi-title" style={{ margin: 0 }}>Dispatched</span>
            <svg style={{ width: '20px', height: '20px', color: 'var(--color-dispatched)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h-.75M12 18.75V14.25m0 0H8.25m3.75 0h8.25M13.5 4.5H16.5a1.5 1.5 0 0 1 1.5 1.5v4.5H12V4.5Zm0 12.75h6a1.5 1.5 0 0 0 1.5-1.5V11.25H12v6Z" />
            </svg>
          </div>
          <span className="kpi-value">{kpis.dispatched}</span>
        </div>

        <div className="kpi-card">
          <div className="kpi-border" style={{ backgroundColor: 'var(--color-delivered)' }}></div>
          <div className="flex justify-between align-center" style={{ marginBottom: '0.5rem' }}>
            <span className="kpi-title" style={{ margin: 0 }}>Delivered</span>
            <svg style={{ width: '20px', height: '20px', color: 'var(--color-delivered)' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
          </div>
          <span className="kpi-value">{kpis.delivered}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card mb-4">
        <div className="card-body" style={{ padding: '1.25rem' }}>
          <div className="grid grid-cols-2 gap-2" style={{ gridTemplateColumns: isAdmin ? '2fr 1fr' : '1fr' }}>
            {isAdmin && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" htmlFor="search-cust">Search Customer</label>
                <input
                  id="search-cust"
                  type="text"
                  className="form-input"
                  value={customerFilter}
                  onChange={(e) => setCustomerFilter(e.target.value)}
                  placeholder="Search by customer name or email..."
                />
              </div>
            )}
            
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="filter-status">Filter Status</label>
              <select
                id="filter-status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Order Records</h2>
          <span className="text-muted" style={{ fontSize: '0.85rem' }}>Showing {orders.length} orders</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {orders.length === 0 ? (
            <div className="text-center text-muted" style={{ padding: '3rem' }}>
              {hasFilters ? (
                <>
                  <h3>No orders found matching filters</h3>
                  <p className="mt-2">Try clearing your filters or search terms.</p>
                </>
              ) : (
                <>
                  <h3>No orders yet</h3>
                  <p className="mt-2">
                    {isAdmin 
                      ? "No customer orders have been placed in the system yet." 
                      : "You haven't placed any supply orders yet. Click 'Place New Order' to begin."
                    }
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date Placed</th>
                    {isAdmin && <th>Customer</th>}
                    <th>Items Count</th>
                    <th>Total Value</th>
                    <th>Delivery Address</th>
                    <th>Status</th>
                    <th className="no-print" style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600 }}>#{order.id}</td>
                      <td>{new Date(order.order_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</td>
                      {isAdmin && (
                        <td>
                          <div className="flex-col">
                            <span style={{ fontWeight: 500 }}>{order.customer_name}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{order.customer_email}</span>
                          </div>
                        </td>
                      )}
                      <td>{order.total_items} units</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{formatCurrency(order.total_amount)}</td>
                      <td className="text-muted" style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.delivery_address}
                      </td>
                      <td>
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="no-print" style={{ textAlign: 'right' }}>
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setSelectedOrderId(order.id);
                              setActivePage('order-detail');
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                          >
                            View
                          </button>

                          {/* Admin Workflow Action Buttons */}
                          {isAdmin && order.status === 'pending' && (
                            <button
                              onClick={() => handleStatusTransition(order.id, 'confirmed')}
                              className="btn btn-success"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              Confirm
                            </button>
                          )}

                          {isAdmin && order.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusTransition(order.id, 'dispatched')}
                              className="btn btn-warning"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              Dispatch
                            </button>
                          )}

                          {isAdmin && order.status === 'dispatched' && (
                            <button
                              onClick={() => handleStatusTransition(order.id, 'delivered')}
                              className="btn btn-primary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                            >
                              Deliver
                            </button>
                          )}

                          {order.status !== 'pending' && (
                            <button
                              onClick={() => {
                                setSelectedOrderId(order.id);
                                setActivePage('invoice-preview');
                              }}
                              className="btn btn-secondary"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', color: 'var(--color-delivered)', borderColor: 'rgba(34,197,94,0.3)' }}
                            >
                              Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
