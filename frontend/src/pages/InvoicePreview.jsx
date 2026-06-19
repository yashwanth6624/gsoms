import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { formatCurrency } from '../utils';

const InvoicePreview = ({ orderId, setActivePage }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInvoiceDetails();
  }, [orderId]);

  const fetchInvoiceDetails = async () => {
    try {
      setError('');
      const response = await api.getInvoice(orderId);
      setData(response);
    } catch (err) {
      setError(err.message || 'Invoice data not found. Ensure order has been Confirmed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6rem' }} className="no-print">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card text-center no-print" style={{ padding: '3rem' }}>
        <h3 className="text-danger">{error || 'Invoice not found'}</h3>
        <p className="text-muted mt-2">Invoices are automatically generated once an order is Confirmed by Admin.</p>
        <button className="btn btn-secondary mt-4" onClick={() => setActivePage('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { invoice, order, items } = data;
  
  // Calculate Subtotal (sum of all items)
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <div className="flex-col">
      {/* Top Header Panel (hidden on print) */}
      <div className="page-header no-print">
        <div className="flex align-center gap-2">
          <button className="btn btn-secondary" onClick={() => setActivePage('dashboard')}>
            ← Dashboard
          </button>
          <h1 className="page-title">Invoice #{invoice.invoice_number}</h1>
        </div>
        <button onClick={handlePrint} className="btn btn-primary">
          🖨 Print Invoice
        </button>
      </div>

      {/* Invoice Sheet Container (Optimized for both screen viewing and physical print) */}
      <div className="card invoice-container-sheet" style={{ maxWidth: '800px', margin: '0.5rem auto 2rem auto', padding: '3rem', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', backgroundColor: '#FFFFFF', position: 'relative' }}>
        
        {/* Floating Print Button for visual screen mode, positioned top-right of sheet but hidden during printing */}
        <button onClick={handlePrint} className="btn btn-primary no-print" style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
          🖨 Print Invoice
        </button>

        {/* 1. Header Block */}
        <div className="flex justify-between align-start mb-4 pb-4" style={{ borderBottom: '2px solid var(--primary-color)' }}>
          <div>
            <h1 style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '1.75rem', lineHeight: '1.2', letterSpacing: '-0.5px' }}>Manikanta Enterprises</h1>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-color)', display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '0.2rem' }}>Order & Supply Portal</span>
            <p className="text-muted mt-2" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
              Main Bazaar, Wholesale Market Road, Guntur, AP, India<br />
              Email: billing@manikanta.com | GSTIN: 37AAAAA1111A1Z1
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ color: 'var(--primary-color)', fontWeight: 800, fontSize: '2.25rem', margin: 0, letterSpacing: '0.5px' }}>INVOICE</h1>
          </div>
        </div>

        {/* 2. Two-Column Info Block */}
        <div className="grid grid-cols-2 gap-2 mb-4 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <div>
            <h4 style={{ color: 'var(--primary-color)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Bill To:</h4>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)' }}>{order.customer_name}</div>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', lineHeight: '1.4' }}>
              Email: {order.customer_email}<br />
              Address: {order.delivery_address}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
            <h4 style={{ color: 'var(--primary-color)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px', marginBottom: '0.5rem', width: '100%' }}>Invoice Details:</h4>
            <div style={{ fontSize: '0.85rem', lineHeight: '1.5' }}>
              <div><strong>Invoice Number:</strong> {invoice.invoice_number}</div>
              <div><strong>Order ID:</strong> #{order.id}</div>
              <div><strong>Invoice Date:</strong> {new Date(invoice.generated_at).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
              <div><strong>Order Date:</strong> {new Date(order.order_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</div>
            </div>
          </div>
        </div>

        {/* 3. Itemized Table */}
        <div style={{ margin: '1.5rem 0' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-color)', textAlign: 'left' }}>Product Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-color)', textAlign: 'left' }}>SKU</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-color)', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-color)', textAlign: 'right' }}>Unit Price</th>
                <th style={{ padding: '0.75rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--secondary-color)', textAlign: 'right' }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-dark)' }}>{item.product_name}</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.875rem', color: 'var(--secondary-color)' }}><code>{item.product_sku}</code></td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.875rem', textAlign: 'center', color: 'var(--text-dark)' }}>{item.quantity} {item.product_unit}</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.875rem', textAlign: 'right', color: 'var(--text-dark)' }}>{formatCurrency(item.unit_price)}</td>
                  <td style={{ padding: '0.85rem 0.5rem', fontSize: '0.875rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-dark)' }}>{formatCurrency(item.quantity * item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 4. Totals Block */}
        <div className="flex" style={{ justifyContent: 'flex-end', marginTop: '1rem' }}>
          <div style={{ width: '280px', fontSize: '0.875rem' }}>
            <div className="flex justify-between mb-2">
              <span className="text-muted">Subtotal:</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between mb-2 pb-2" style={{ borderBottom: '2px solid var(--border-color)' }}>
              <span className="text-muted">GST (Included 18%):</span>
              <span style={{ fontWeight: 500 }}>{formatCurrency(subtotal - (subtotal / 1.18))}</span>
            </div>
            <div className="flex justify-between align-center" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
              <span>Total Amount:</span>
              <span>{formatCurrency(invoice.total_amount)}</span>
            </div>
          </div>
        </div>

        {/* 5. Footer Block */}
        <div className="flex justify-between align-end mt-5 pt-4" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--secondary-color)' }}>
          <div style={{ maxWidth: '400px' }}>
            <p style={{ fontWeight: 500, color: 'var(--text-dark)', marginBottom: '0.25rem' }}>Thank you for your business with Manikanta Enterprises</p>
            <p>Terms: Invoice is subject to Guntur jurisdiction. Payment is due within 15 days of order delivery.</p>
          </div>
          <div style={{ textAlign: 'right', width: '180px' }}>
            <div style={{ borderBottom: '1px solid var(--border-color)', height: '40px' }}></div>
            <p className="mt-2" style={{ fontWeight: 600, color: 'var(--text-dark)' }}>Authorized Signatory</p>
            <p>Manikanta Enterprises</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InvoicePreview;
