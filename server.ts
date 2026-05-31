import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { connectDB } from './src/server/db.js';
import productsRouter from './src/server/routes/products.js';
import paymentsRouter from './src/server/routes/payments.js';
import contactRouter from './src/server/routes/contact.js';
import ordersRouter from './src/server/routes/orders.js';
import couponsRouter from './src/server/routes/coupons.js';
import newsletterRouter from './src/server/routes/newsletter.js';
import reviewsRouter from './src/server/routes/reviews.js';
import adminAuthRouter from './src/server/routes/admin/auth.js';
import adminAnalyticsRouter from './src/server/routes/admin/analytics.js';
import adminProductsRouter from './src/server/routes/admin/products.js';
import adminOrdersRouter from './src/server/routes/admin/orders.js';
import adminPaymentsRouter from './src/server/routes/admin/payments.js';
import adminCouponsRouter from './src/server/routes/admin/coupons.js';
import adminCustomersRouter from './src/server/routes/admin/customers.js';
import adminUploadRouter from './src/server/routes/admin/upload.js';
import adminReportsRouter from './src/server/routes/admin/reports.js';
import adminRefundsRouter from './src/server/routes/admin/refunds.js';
import { loginLimiter, apiLimiter, paymentLimiter } from './src/server/middleware/rateLimiter.js';

dotenv.config();

async function startServer() {
  await connectDB();

  const app = express();
  const PORT = 3000;

  // The webhook route needs the raw body for signature verification.
  // Mount express.raw() specifically for the webhook path BEFORE express.json().
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

  app.use(express.json());
  app.use(cookieParser());

  // General API rate limit
  app.use('/api', apiLimiter);

  // API Routes
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public product routes
  app.use('/api/products', productsRouter);

  // Payment routes (includes /webhook, /order, /verify) — with stricter rate limit
  app.use('/api/payments/order', paymentLimiter);
  app.use('/api/payments/verify', paymentLimiter);
  app.use('/api/payments', paymentsRouter);

  // Contact form route
  app.use('/api/contact', contactRouter);

  // User orders route
  app.use('/api/orders', ordersRouter);

  // Coupon routes
  app.use('/api/coupons', couponsRouter);

  // Newsletter routes
  app.use('/api/newsletter', newsletterRouter);

  // Reviews routes
  app.use('/api/reviews', reviewsRouter);

  // Admin auth routes — with login rate limit
  app.use('/api/admin/login', loginLimiter);
  app.use('/api/admin', adminAuthRouter);

  // Admin product routes
  app.use('/api/admin/products', adminProductsRouter);

  // Admin order routes
  app.use('/api/admin/orders', adminOrdersRouter);

  // Admin payment routes
  app.use('/api/admin/payments', adminPaymentsRouter);

  // Admin coupon routes
  app.use('/api/admin/coupons', adminCouponsRouter);

  // Admin customer routes
  app.use('/api/admin/customers', adminCustomersRouter);

  // Admin image upload route
  app.use('/api/admin/upload-images', adminUploadRouter);

  // Serve uploaded files statically
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Admin analytics routes
  app.use('/api/admin/analytics', adminAnalyticsRouter);

  // Admin reports routes
  app.use('/api/admin/reports', adminReportsRouter);

  // Admin refunds routes
  app.use('/api/admin/refunds', adminRefundsRouter);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
