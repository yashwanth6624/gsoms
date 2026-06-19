const express = require('express');
const cors = require('cors');
const { initDb, get } = require('./db');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const invoiceRoutes = require('./routes/invoices');
const insightRoutes = require('./routes/insights');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend connectivity
app.use(cors({
  origin: '*', // Allow all origins for local development simplicity
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json());

// Logger middleware for debugging endpoints
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Mount API Routers
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/insights', insightRoutes);

// Base route healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'GSOMS backend is running successfully' });
});

// Custom 404 Error handler
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global 500 Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    
    // Auto-seed if database is empty
    const productCheck = await get('SELECT COUNT(*) as count FROM products');
    if (productCheck && productCheck.count === 0) {
      console.log('Database is empty. Running auto-seeding...');
      const seed = require('./seed');
      await seed();
    }

    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(` GSOMS Server listening on port: ${PORT}`);
      console.log(` Healthcheck: http://localhost:${PORT}/health`);
      console.log(`================================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
