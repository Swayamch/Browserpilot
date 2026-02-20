const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const connectDB = require('./config/db');
const seedTemplates = require('./seeds/templates');

// Route imports
const authRoutes = require('./routes/auth');
const rulesRoutes = require('./routes/rules');
const templatesRoutes = require('./routes/templates');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');

const app = express();

// --- Middleware ---
app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/rules', rulesRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start ---
const start = async () => {
  await connectDB();
  await seedTemplates();

  app.listen(config.port, () => {
    console.log(`BrowserPilot API running on port ${config.port}`);
  });
};

start();

module.exports = app;
