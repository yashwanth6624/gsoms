const bcrypt = require('bcryptjs');
const { initDb, run, get } = require('./db');

const seed = async () => {
  try {
    // 1. Initialize tables
    await initDb();

    console.log('Seeding updated realistic data...');

    // Clear existing data to allow fresh seed
    await run('DELETE FROM invoices');
    await run('DELETE FROM order_status_history');
    await run('DELETE FROM order_items');
    await run('DELETE FROM orders');
    await run('DELETE FROM warehouse_stock');
    await run('DELETE FROM products');
    await run('DELETE FROM users');
    
    // Reset autoincrement sequences
    await run('DELETE FROM sqlite_sequence');

    // 2. Hash passwords
    const salt = await bcrypt.genSalt(10);
    const adminPasswordHash = await bcrypt.hash('adminpassword', salt);
    const customerPasswordHash = await bcrypt.hash('customerpassword', salt);

    // 3. Create users
    const adminResult = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Manikanta Admin', 'admin@manikanta.com', adminPasswordHash, 'admin']
    );
    const adminId = adminResult.id;
    console.log('Created Admin User (ID:', adminId, ')');

    const raoResult = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Rao Traders', 'customer@manikanta.com', customerPasswordHash, 'customer']
    );
    const raoId = raoResult.id;
    console.log('Created Customer User (Rao Traders, ID:', raoId, ')');

    const saiResult = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Sai Distributors', 'sai.distributors@gmail.com', customerPasswordHash, 'customer']
    );
    const saiId = saiResult.id;
    console.log('Created Customer User (Sai Distributors, ID:', saiId, ')');

    const krishnaResult = await run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Krishna Traders', 'krishna.traders@gmail.com', customerPasswordHash, 'customer']
    );
    const krishnaId = krishnaResult.id;
    console.log('Created Customer User (Krishna Traders, ID:', krishnaId, ')');

    // 4. Create products with initial warehouse stock
    // 4. Create products with initial warehouse stock (50 FMCG Products for Manikanta Enterprises)
    const productsData = [
      { name: 'Tata Salt 1kg', sku: 'TS-001', unit: 'kg', price: 28.0, initial_stock: 120 },
      { name: 'Aashirvaad Atta 5kg', sku: 'AA-005', unit: 'bag', price: 275.0, initial_stock: 45 },
      { name: 'Fortune Mustard Oil 1L', sku: 'FO-001', unit: 'bottle', price: 185.0, initial_stock: 18 },
      { name: 'Maggi Noodles 12-Pack', sku: 'MN-012', unit: 'pack', price: 168.0, initial_stock: 60 },
      { name: 'Dettol Liquid Handwash 200ml', sku: 'DH-200', unit: 'pcs', price: 99.0, initial_stock: 12 },
      { name: 'Britannia Marie Gold 250g', sku: 'BM-250', unit: 'pack', price: 35.0, initial_stock: 150 },
      { name: 'Parle-G Biscuits 800g', sku: 'PG-800', unit: 'pack', price: 80.0, initial_stock: 100 },
      { name: 'Surf Excel Easy Wash 1kg', sku: 'SE-001', unit: 'bag', price: 140.0, initial_stock: 75 },
      { name: 'Vim Dishwash Liquid 500ml', sku: 'VD-500', unit: 'bottle', price: 115.0, initial_stock: 40 },
      { name: 'Harpic Toilet Cleaner 1L', sku: 'HT-001', unit: 'bottle', price: 195.0, initial_stock: 35 },
      { name: 'Colgate Strong Teeth 200g', sku: 'CS-200', unit: 'pcs', price: 110.0, initial_stock: 90 },
      { name: 'Sensodyne Fresh Gel 100g', sku: 'SF-100', unit: 'pcs', price: 160.0, initial_stock: 50 },
      { name: 'Lux Soap Bar 100g', sku: 'LS-100', unit: 'pcs', price: 38.0, initial_stock: 200 },
      { name: 'Lifebuoy Total 100g', sku: 'LT-100', unit: 'pcs', price: 35.0, initial_stock: 220 },
      { name: 'Clinic Plus Shampoo 340ml', sku: 'CP-340', unit: 'bottle', price: 210.0, initial_stock: 55 },
      { name: 'Head & Shoulders Shampoo 340ml', sku: 'HS-340', unit: 'bottle', price: 320.0, initial_stock: 30 },
      { name: 'Dove Cream Bar 100g', sku: 'DC-100', unit: 'pcs', price: 65.0, initial_stock: 120 },
      { name: 'Taj Mahal Tea 500g', sku: 'TM-500', unit: 'box', price: 350.0, initial_stock: 45 },
      { name: 'Red Label Tea 1kg', sku: 'RL-001', unit: 'box', price: 480.0, initial_stock: 40 },
      { name: 'Nescafe Classic Coffee 100g', sku: 'NC-100', unit: 'jar', price: 310.0, initial_stock: 60 },
      { name: 'Bru Gold Coffee 100g', sku: 'BG-100', unit: 'jar', price: 330.0, initial_stock: 35 },
      { name: 'Amul Butter 500g', sku: 'AB-500', unit: 'block', price: 275.0, initial_stock: 80 },
      { name: 'Amul Cheese Slices 200g', sku: 'AC-200', unit: 'pack', price: 150.0, initial_stock: 70 },
      { name: 'Dabur Honey 500g', sku: 'DH-500', unit: 'jar', price: 220.0, initial_stock: 50 },
      { name: 'Saffola Gold Oil 5L', sku: 'SG-005', unit: 'can', price: 950.0, initial_stock: 25 },
      { name: 'Sunfeast Dark Fantasy 300g', sku: 'DF-300', unit: 'box', price: 120.0, initial_stock: 80 },
      { name: 'Haldiram Bhujia 400g', sku: 'HB-400', unit: 'pack', price: 110.0, initial_stock: 120 },
      { name: 'Kurkure Masala Munch 90g', sku: 'KM-090', unit: 'pack', price: 20.0, initial_stock: 300 },
      { name: 'Lays Classic Salted 90g', sku: 'LC-090', unit: 'pack', price: 20.0, initial_stock: 300 },
      { name: 'Tropicana Mixed Fruit Juice 1L', sku: 'TF-001', unit: 'pack', price: 120.0, initial_stock: 65 },
      { name: 'Real Cranberry Juice 1L', sku: 'RC-001', unit: 'pack', price: 125.0, initial_stock: 60 },
      { name: 'Kelloggs Corn Flakes 875g', sku: 'KC-875', unit: 'box', price: 360.0, initial_stock: 35 },
      { name: 'Quaker Oats 1kg', sku: 'QO-001', unit: 'bag', price: 199.0, initial_stock: 50 },
      { name: 'Lizol Disinfectant 1L', sku: 'LD-001', unit: 'bottle', price: 215.0, initial_stock: 40 },
      { name: 'Comfort Fabric Conditioner 860ml', sku: 'CF-860', unit: 'bottle', price: 235.0, initial_stock: 30 },
      { name: 'Ariel Complete 1kg', sku: 'AC-001', unit: 'bag', price: 190.0, initial_stock: 70 },
      { name: 'Whisper Choice Wings 20-Pack', sku: 'WC-020', unit: 'pack', price: 115.0, initial_stock: 95 },
      { name: 'Gillette Guard Razor', sku: 'GG-001', unit: 'pcs', price: 25.0, initial_stock: 150 },
      { name: 'Dettol Antiseptic Liquid 500ml', sku: 'DA-500', unit: 'bottle', price: 220.0, initial_stock: 80 },
      { name: 'Horlicks Chocolate 1kg', sku: 'HC-001', unit: 'jar', price: 495.0, initial_stock: 45 },
      { name: 'Boost Health Drink 1kg', sku: 'BD-001', unit: 'jar', price: 510.0, initial_stock: 40 },
      { name: 'Bournvita 1kg', sku: 'BV-001', unit: 'jar', price: 485.0, initial_stock: 40 },
      { name: 'Tata Tea Premium 1kg', sku: 'TP-001', unit: 'bag', price: 420.0, initial_stock: 50 },
      { name: 'Everest Garam Masala 100g', sku: 'EG-100', unit: 'pack', price: 82.0, initial_stock: 110 },
      { name: 'MDH Deggi Mirch 100g', sku: 'MD-100', unit: 'pack', price: 88.0, initial_stock: 105 },
      { name: 'Catch Turmeric Powder 200g', sku: 'CT-200', unit: 'pack', price: 60.0, initial_stock: 130 },
      { name: 'Catch Coriander Powder 200g', sku: 'CC-200', unit: 'pack', price: 65.0, initial_stock: 125 },
      { name: 'Cadbury Dairy Milk Family Pack', sku: 'DM-130', unit: 'pcs', price: 100.0, initial_stock: 140 },
      { name: 'Kissan Tomato Ketchup 1kg', sku: 'KK-001', unit: 'bottle', price: 140.0, initial_stock: 50 },
      { name: 'Maggi Hot & Sweet Sauce 1kg', sku: 'MHS-001', unit: 'bottle', price: 155.0, initial_stock: 45 }
    ];

    const prodMap = {}; // mapping SKU to db row

    for (const prod of productsData) {
      const prodResult = await run(
        'INSERT INTO products (name, sku, unit, price) VALUES (?, ?, ?, ?)',
        [prod.name, prod.sku, prod.unit, prod.price]
      );
      const prodId = prodResult.id;
      prodMap[prod.sku] = { id: prodId, name: prod.name, price: prod.price, unit: prod.unit };
      
      // Initialize stock
      await run(
        'INSERT INTO warehouse_stock (product_id, available_qty) VALUES (?, ?)',
        [prodId, prod.initial_stock]
      );
    }
    console.log('Created catalog products and initialized stocks.');

    // Helper to format dates relative to now
    const getDateRelative = (daysOffset, hoursOffset = 0) => {
      const d = new Date();
      d.setDate(d.getDate() - daysOffset);
      d.setHours(d.getHours() - hoursOffset);
      return d.toISOString().replace('T', ' ').substring(0, 19);
    };

    // Helper to add order, items, history, and deduct stock if needed
    const createSeededOrder = async ({ customerId, status, daysAgo, address, notes, items }) => {
      const orderDate = getDateRelative(daysAgo);
      
      // Insert order
      const orderResult = await run(
        'INSERT INTO orders (customer_id, status, order_date, delivery_address, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [customerId, status, orderDate, address, notes, orderDate, orderDate]
      );
      const orderId = orderResult.id;

      let totalAmount = 0;

      // Add items
      for (const item of items) {
        const prod = prodMap[item.sku];
        const subtotal = item.qty * prod.price;
        totalAmount += subtotal;

        await run(
          'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
          [orderId, prod.id, item.qty, prod.price]
        );

        // Deduct warehouse stock if confirmed, dispatched, or delivered
        if (status !== 'pending') {
          await run(
            'UPDATE warehouse_stock SET available_qty = available_qty - ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?',
            [item.qty, prod.id]
          );
        }
      }

      // Add status history sequence
      // Every order starts as pending
      await run(
        'INSERT INTO order_status_history (order_id, status, changed_at, changed_by) VALUES (?, \'pending\', ?, ?)',
        [orderId, orderDate, customerId]
      );

      if (status === 'confirmed' || status === 'dispatched' || status === 'delivered') {
        const confirmDate = getDateRelative(daysAgo, -2); // 2 hours after creation
        await run(
          'INSERT INTO order_status_history (order_id, status, changed_at, changed_by) VALUES (?, \'confirmed\', ?, ?)',
          [orderId, confirmDate, adminId]
        );
        // Generate Invoice
        const invoiceNum = `INV-2026-${orderId.toString().padStart(4, '0')}`;
        await run(
          'INSERT INTO invoices (order_id, invoice_number, total_amount, generated_at) VALUES (?, ?, ?, ?)',
          [orderId, invoiceNum, totalAmount, confirmDate]
        );
      }

      if (status === 'dispatched' || status === 'delivered') {
        const dispatchDate = getDateRelative(daysAgo, -4); // 4 hours after creation
        await run(
          'INSERT INTO order_status_history (order_id, status, changed_at, changed_by) VALUES (?, \'dispatched\', ?, ?)',
          [orderId, dispatchDate, adminId]
        );
      }

      if (status === 'delivered') {
        const deliverDate = getDateRelative(daysAgo, -8); // 8 hours after creation
        await run(
          'INSERT INTO order_status_history (order_id, status, changed_at, changed_by) VALUES (?, \'delivered\', ?, ?)',
          [orderId, deliverDate, adminId]
        );
      }

      console.log(`Seeded ${status.toUpperCase()} Order #${orderId} (Customer: ${customerId}, Total: ₹${totalAmount})`);
    };

    // Order 1: Rao Traders - Pending - 3 days ago (Delayed backlog to trigger pending alert!)
    await createSeededOrder({
      customerId: raoId,
      status: 'pending',
      daysAgo: 3,
      address: 'Shop 12, Main Road, Vijayawada',
      notes: 'Deliver before 12 PM please.',
      items: [
        { sku: 'TS-001', qty: 10 },
        { sku: 'DH-200', qty: 2 }
      ]
    });

    // Order 2: Sai Distributors - Confirmed - 1 day ago
    await createSeededOrder({
      customerId: saiId,
      status: 'confirmed',
      daysAgo: 1,
      address: 'Plot 4A, Auto Nagar, Guntur',
      notes: 'Call 9876543210 before shipping.',
      items: [
        { sku: 'AA-005', qty: 5 },
        { sku: 'MN-012', qty: 4 }
      ]
    });

    // Order 3: Krishna Traders - Delivered - 2 days ago
    await createSeededOrder({
      customerId: krishnaId,
      status: 'delivered',
      daysAgo: 2,
      address: 'Flat 101, Revenue Colony, Vijayawada',
      notes: 'Billing address same as delivery.',
      items: [
        { sku: 'TS-001', qty: 8 },
        { sku: 'FO-001', qty: 2 }
      ]
    });

    // Order 4: Krishna Traders - Pending - 4 hours ago (Fresh pending)
    await createSeededOrder({
      customerId: krishnaId,
      status: 'pending',
      daysAgo: 0,
      address: 'Flat 101, Revenue Colony, Vijayawada',
      notes: 'Urgent wholesale supply.',
      items: [
        { sku: 'DH-200', qty: 1 }
      ]
    });

    // Order 5: Sai Distributors - Dispatched - 1.5 days ago (Satisfies Issue 2 - Order in dispatched status)
    await createSeededOrder({
      customerId: saiId,
      status: 'dispatched',
      daysAgo: 1.5,
      address: 'Plot 4A, Auto Nagar, Guntur',
      notes: 'Ensure double packaging.',
      items: [
        { sku: 'TS-001', qty: 15 },
        { sku: 'FO-001', qty: 10 } // falls stock low: 18 - 2 (deliv) - 10 (disp) = 6 bottle (trigger stock alert!)
      ]
    });

    console.log('Seeding completed successfully.');

    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('Error seeding data:', error);
    if (require.main === module) {
      process.exit(1);
    }
  }
};

if (require.main === module) {
  seed();
}

module.exports = seed;
