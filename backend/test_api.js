const { exec } = require('child_process');

const BASE_URL = 'http://localhost:5000/api';

// Helper to make API calls using native fetch
const apiCall = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  const text = await response.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch (e) {
    // Return raw text if not json
    return { status: response.status, body: text };
  }
  return { status: response.status, body: json };
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const runTests = async () => {
  console.log('=== STARTING INTEGRATION TESTS ===');
  
  // 1. Verify healthcheck
  const healthRes = await fetch('http://localhost:5000/health');
  if (healthRes.ok) {
    console.log('✔ Healthcheck succeeded:', await healthRes.json());
  } else {
    console.error('❌ Healthcheck failed. Server might not be running.');
    process.exit(1);
  }

  let customerToken = '';
  let customerId = null;
  let adminToken = '';
  let orderId = null;
  let tataSaltProduct = null;
  let maggiProduct = null;

  // 2. Register a new test customer
  const uniqueEmail = `test_customer_${Date.now()}@manikanta.com`;
  const registerRes = await apiCall('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Customer Rao',
      email: uniqueEmail,
      password: 'customerpassword',
      role: 'customer'
    })
  });
  
  if (registerRes.status === 201) {
    console.log('✔ Customer registration succeeded. ID:', registerRes.body.userId);
  } else {
    console.error('❌ Customer registration failed:', registerRes.body);
    process.exit(1);
  }

  // 3. Login as Customer
  const loginRes = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: uniqueEmail,
      password: 'customerpassword'
    })
  });

  if (loginRes.status === 200) {
    customerToken = loginRes.body.token;
    customerId = loginRes.body.user.id;
    console.log('✔ Customer login succeeded. Token acquired.');
  } else {
    console.error('❌ Customer login failed:', loginRes.body);
    process.exit(1);
  }

  // 4. Login as Admin
  const adminLoginRes = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: 'admin@manikanta.com',
      password: 'adminpassword'
    })
  });

  if (adminLoginRes.status === 200) {
    adminToken = adminLoginRes.body.token;
    console.log('✔ Admin login succeeded. Token acquired.');
  } else {
    console.error('❌ Admin login failed:', adminLoginRes.body);
    process.exit(1);
  }

  // 5. GET products and stock levels (Customer token)
  const productsRes = await apiCall('/products', {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  if (productsRes.status === 200 && Array.isArray(productsRes.body)) {
    console.log(`✔ Fetched ${productsRes.body.length} products with stock levels.`);
    tataSaltProduct = productsRes.body.find(p => p.sku === 'TS-001');
    maggiProduct = productsRes.body.find(p => p.sku === 'MN-012');
    console.log(`  - Tata Salt current stock: ${tataSaltProduct.available_qty}`);
    console.log(`  - Maggi Noodles current stock: ${maggiProduct.available_qty}`);
  } else {
    console.error('❌ Fetch products failed:', productsRes.body);
    process.exit(1);
  }

  // 6. Create order as Customer
  const orderItems = [
    { product_id: tataSaltProduct.id, quantity: 5 },
    { product_id: maggiProduct.id, quantity: 2 }
  ];
  
  const createOrderRes = await apiCall('/orders', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${customerToken}` },
    body: JSON.stringify({
      delivery_address: 'Plot 45, Industrial Zone, Vijayawada',
      notes: 'Please pack securely in cardboard boxes.',
      items: orderItems
    })
  });

  if (createOrderRes.status === 201) {
    orderId = createOrderRes.body.orderId;
    console.log(`✔ Order creation succeeded. Order ID: ${orderId}`);
  } else {
    console.error('❌ Order creation failed:', createOrderRes.body);
    process.exit(1);
  }

  // 7. Get Order detail
  const detailRes = await apiCall(`/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  if (detailRes.status === 200) {
    console.log(`✔ Order detail fetched successfully.`);
    console.log(`  - Status: ${detailRes.body.order.status} (expected: pending)`);
    console.log(`  - Items count: ${detailRes.body.items.length} (expected: 2)`);
    console.log(`  - Timeline events count: ${detailRes.body.history.length} (expected: 1)`);
  } else {
    console.error('❌ Order detail fetch failed:', detailRes.body);
    process.exit(1);
  }

  // 8. Attempt status jump - Skip Confirm (Pending -> Dispatched)
  // Should fail with 400
  const skipConfirmRes = await apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'dispatched' })
  });

  if (skipConfirmRes.status === 400) {
    console.log(`✔ Skip confirm test passed (Server correctly blocked transition: ${skipConfirmRes.body.error})`);
  } else {
    console.error('❌ Skip confirm test failed! Jump was allowed or returned unexpected status:', skipConfirmRes.status, skipConfirmRes.body);
    process.exit(1);
  }

  // 9. Confirm the order (Pending -> Confirmed)
  // Should trigger stock deduction and invoice generation
  const confirmRes = await apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'confirmed' })
  });

  if (confirmRes.status === 200) {
    console.log(`✔ Order confirmed successfully.`);
  } else {
    console.error('❌ Order confirmation failed:', confirmRes.body);
    process.exit(1);
  }

  // 10. Check stock levels after confirmation
  const productsAfterConfirmRes = await apiCall('/products', {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  
  if (productsAfterConfirmRes.status === 200) {
    const tataSaltAfter = productsAfterConfirmRes.body.find(p => p.sku === 'TS-001');
    const maggiAfter = productsAfterConfirmRes.body.find(p => p.sku === 'MN-012');
    const expectedSalt = tataSaltProduct.available_qty - 5;
    const expectedMaggi = maggiProduct.available_qty - 2;

    if (tataSaltAfter.available_qty === expectedSalt && maggiAfter.available_qty === expectedMaggi) {
      console.log(`✔ Stock deduction verified successfully.`);
      console.log(`  - Tata Salt stock: ${tataSaltAfter.available_qty} (expected: ${expectedSalt})`);
      console.log(`  - Maggi Noodles stock: ${maggiAfter.available_qty} (expected: ${expectedMaggi})`);
    } else {
      console.error('❌ Stock deduction mismatch!', {
        saltBefore: tataSaltProduct.available_qty, saltAfter: tataSaltAfter.available_qty, expectedSalt,
        maggiBefore: maggiProduct.available_qty, maggiAfter: maggiAfter.available_qty, expectedMaggi
      });
      process.exit(1);
    }
  } else {
    console.error('❌ Products fetch after confirm failed:', productsAfterConfirmRes.body);
    process.exit(1);
  }

  // 11. Check Invoice generation
  const invoiceRes = await apiCall(`/invoices/${orderId}`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  if (invoiceRes.status === 200) {
    console.log('✔ Invoice fetch succeeded.');
    console.log('  - Invoice Number:', invoiceRes.body.invoice.invoice_number);
    console.log('  - Total Amount:', invoiceRes.body.invoice.total_amount);
  } else {
    console.error('❌ Invoice fetch failed:', invoiceRes.body);
    process.exit(1);
  }

  // 12. Dispatch the order (Confirmed -> Dispatched)
  const dispatchRes = await apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'dispatched' })
  });

  if (dispatchRes.status === 200) {
    console.log('✔ Order dispatched successfully.');
  } else {
    console.error('❌ Order dispatch failed:', dispatchRes.body);
    process.exit(1);
  }

  // 13. Deliver the order (Dispatched -> Delivered)
  const deliverRes = await apiCall(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered' })
  });

  if (deliverRes.status === 200) {
    console.log('✔ Order delivered successfully.');
  } else {
    console.error('❌ Order delivery failed:', deliverRes.body);
    process.exit(1);
  }

  // 14. Verify timeline status history
  const detailFinalRes = await apiCall(`/orders/${orderId}`, {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });

  if (detailFinalRes.status === 200) {
    const history = detailFinalRes.body.history;
    console.log(`✔ Final timeline verification:`);
    history.forEach((h, index) => {
      console.log(`  ${index + 1}. Status: ${h.status} | By: ${h.changed_by_name} (${h.changed_by_role})`);
    });
    if (history.length === 4) {
      console.log('✔ Status history has all 4 sequential steps logged.');
    } else {
      console.error('❌ Status history timeline length mismatch. Expected 4 events, found:', history.length);
      process.exit(1);
    }
  } else {
    console.error('❌ Final order detail fetch failed:', detailFinalRes.body);
    process.exit(1);
  }

  // 15. Verify Admin Insights API
  const insightsRes = await apiCall('/insights', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  if (insightsRes.status === 200) {
    console.log('✔ Insights API fetched successfully:');
    console.log(`  - Pending orders > 2 days old: ${insightsRes.body.pendingOrdersOld.length}`);
    console.log(`  - Top products ordered this week: ${insightsRes.body.topProducts.length}`);
    console.log(`  - Low stock warning products: ${insightsRes.body.lowStockProducts.length}`);
    insightsRes.body.lowStockProducts.forEach(p => {
      console.log(`    * [Low Stock Alert] SKU: ${p.sku} | Name: ${p.name} | Available: ${p.available_qty}`);
    });
  } else {
    console.error('❌ Insights fetch failed:', insightsRes.body);
    process.exit(1);
  }

  console.log('=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===');
};

runTests().catch(error => {
  console.error('❌ Test script unhandled error:', error);
  process.exit(1);
});
