# Implementation Plan: Admin Panel and Payments

## Overview

This plan implements the full admin panel, MongoDB data layer, and Razorpay payment integration for the Zarevielle e-commerce application. The implementation progresses from data models → backend API routes → admin authentication → admin APIs → frontend payment integration → admin panel UI → final wiring. TypeScript is used throughout (Express.js backend, React frontend).

## Tasks

- [x] 1. Set up MongoDB models and database connection
  - [x] 1.1 Install backend dependencies and connect MongoDB
    - Install `mongoose`, `bcrypt`, `cookie-parser`, `multer`, `crypto` (built-in), `@types/bcrypt`, `@types/cookie-parser`, `@types/multer`
    - Create `src/server/db.ts` with MongoDB connection using `mongoose.connect()` (connection string from `MONGODB_URI` env var)
    - Import and call the connection in `server.ts` before starting the Express app
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 1.2 Create Product model
    - Create `src/server/models/Product.ts` with Mongoose schema matching the design: name, description, price, category, colors (array of {name, hexCode}), images (array of URLs), stock, featured, timestamps
    - Add indexes on `category` and `featured`
    - Add validation: name maxlength 100, description maxlength 2000, price min 0.01 max 999999999.99, category maxlength 50, colors max 20 entries with hex validation, images max 10, stock min 0
    - _Requirements: 7.1, 7.7_

  - [x] 1.3 Create Order model
    - Create `src/server/models/Order.ts` with Mongoose schema: userId, customerEmail, items (array of OrderItem), totalAmount, status (enum), shippingAddress, paymentId, razorpayOrderId, statusHistory, shippedAt, timestamps
    - Add indexes on `status`, `createdAt`, `customerEmail`
    - Define the `VALID_TRANSITIONS` map for order status state machine
    - _Requirements: 7.2, 7.6, 7.7, 7.8, 4.4, 4.5_

  - [x] 1.4 Create Payment model
    - Create `src/server/models/Payment.ts` with Mongoose schema: orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, amount, currency, status (enum), method, customerEmail, timestamps
    - Add indexes on `status`, `createdAt`, `razorpayOrderId`
    - _Requirements: 7.3, 7.6, 7.7_

  - [x] 1.5 Create AdminUser and Session models
    - Create `src/server/models/AdminUser.ts`: username (unique, 3–50 chars), passwordHash, failedLoginAttempts, lockedUntil, lastLoginAt, timestamps
    - Create `src/server/models/Session.ts`: token (unique, indexed), adminId (ref AdminUser), expiresAt, createdAt
    - Add TTL index on `expiresAt` for automatic session cleanup
    - _Requirements: 7.4, 7.6, 7.7_

  - [x] 1.6 Create DailyAnalytics model
    - Create `src/server/models/DailyAnalytics.ts`: date (unique), ordersPlaced, ordersShipped, totalTransactions, totalRevenue, perProductRevenue array
    - Add index on `date` descending
    - _Requirements: 7.5, 7.6_

  - [x] 1.7 Create seed script for initial admin user and products
    - Create `src/server/seed.ts` that:
      - Creates a default admin user (username: `admin`, password: `admin123456`) with bcrypt hash (cost 10)
      - Migrates the 4 products from `src/data/initialProducts.ts` into MongoDB (adapting the schema: single imageUrl → images array, add colors as empty array)
    - Add `"seed"` script to package.json: `tsx src/server/seed.ts`
    - _Requirements: 1.6, 2.2_

- [x] 2. Implement public API routes (products and payments)
  - [x] 2.1 Create public product routes
    - Create `src/server/routes/products.ts` with Express Router
    - `GET /api/products` — list products with pagination (page, pageSize query params, default 20), optional category filter, return `{ data, total, page, pageSize, totalPages }`
    - `GET /api/products/:id` — get single product by MongoDB `_id`
    - Mount router in `server.ts`
    - _Requirements: 8.6, 3.6_

  - [x] 2.2 Create payment order creation route
    - Create `src/server/routes/payments.ts` with Express Router
    - `POST /api/payments/order` — validate non-empty cart items and shipping address in request body, create Order in MongoDB (status: "placed"), create Razorpay order (amount in paise = totalAmount × 100, currency INR, receipt = `rcpt_${orderId}`), update Order with razorpayOrderId, create Payment record (status: "pending"), return `{ razorpayOrderId, amount, currency }`
    - Reject empty cart with 400 error
    - Handle Razorpay API timeout (30s) with 502 error
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [x] 2.3 Create payment verification route
    - `POST /api/payments/verify` — validate required fields (razorpay_order_id, razorpay_payment_id, razorpay_signature), compute HMAC SHA256 of `order_id|payment_id` using Razorpay secret, compare with signature
    - On match: update Payment status → "paid", update Order status → "confirmed", atomically decrement stock for each item using `findOneAndUpdate` with `$gte` condition, append to statusHistory
    - On mismatch: update Payment status → "failed", return error
    - Handle missing fields with 400 and field-level errors
    - Handle orphaned payment (order not found) with error + logging
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 3.4, 3.5_

  - [x] 2.4 Create webhook endpoint
    - `POST /api/payments/webhook` — verify webhook signature using Razorpay webhook secret, handle `payment.captured` (update Payment → "paid", Order → "confirmed") and `payment.failed` (Payment → "failed") events
    - Implement idempotency: check current status before updating
    - Return 200 for valid events, 400 for invalid signature
    - Log failed signature attempts with IP and timestamp
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [ ]* 2.5 Write property tests for payment verification logic
    - **Property 17: Payment signature verification determines outcome**
    - **Property 18: Verification request validation**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.6**

  - [ ]* 2.6 Write property tests for order and stock logic
    - **Property 8: Atomic stock decrement preserves non-negativity**
    - **Property 10: Order status state machine**
    - **Property 15: Amount conversion to paise**
    - **Property 16: Receipt uniqueness**
    - **Validates: Requirements 3.4, 3.5, 4.5, 8.1, 8.5**

- [x] 3. Checkpoint - Ensure backend compiles and models are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement admin authentication
  - [x] 4.1 Create admin auth middleware
    - Create `src/server/middleware/adminAuth.ts`
    - Extract `admin_session` cookie, look up Session in MongoDB, validate not expired
    - If no token or invalid/expired session: return 401 without disclosing route existence
    - If valid session but no admin found: return 403
    - Attach `req.admin` for downstream handlers
    - _Requirements: 12.3, 12.4, 12.5, 1.4_

  - [x] 4.2 Create admin login and logout routes
    - Create `src/server/routes/admin/auth.ts`
    - `POST /api/admin/login` — validate username (3–64 chars) and password (8–128 chars), find AdminUser, check account lockout (5 failed attempts in 15 min → lock 15 min), bcrypt compare, create Session (opaque token via `crypto.randomBytes(32).toString('hex')`), set HTTP-only secure cookie, reset failed attempts on success, increment on failure
    - `POST /api/admin/logout` — delete Session from MongoDB, clear cookie
    - `GET /api/admin/session` — validate current session, return admin info
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8_

  - [ ]* 4.3 Write property tests for authentication
    - **Property 1: Authentication correctness**
    - **Property 2: Admin route protection**
    - **Property 3: Session lifecycle**
    - **Property 4: Password storage security**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.6, 12.3**

- [x] 5. Implement admin API routes
  - [x] 5.1 Create admin product routes
    - Create `src/server/routes/admin/products.ts`
    - `GET /api/admin/products` — paginated list (20/page), all fields including stock
    - `POST /api/admin/products` — create product with full validation (name, description, price, category, colors, images, stock, featured), return field-level errors on failure
    - `PUT /api/admin/products/:id` — update product with same validation
    - `DELETE /api/admin/products/:id` — delete product by ID
    - `POST /api/admin/products/:id/images` — multer upload (max 5MB, jpeg/png/webp, max 10 files), store in `/uploads/products/`, return URLs
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3_

  - [x] 5.2 Create admin order routes
    - Create `src/server/routes/admin/orders.ts`
    - `GET /api/admin/orders` — paginated (20/page), sorted by createdAt desc, filterable by status, searchable by customerEmail or order ID
    - `GET /api/admin/orders/:id` — full order detail with items, address, payment info, status history
    - `PATCH /api/admin/orders/:id/status` — validate status transition using `VALID_TRANSITIONS` map, append to statusHistory with timestamp, record shippedAt when status → "shipped", return error for invalid transitions
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 5.3 Create admin payment routes
    - Create `src/server/routes/admin/payments.ts`
    - `GET /api/admin/payments` — paginated (20/page), sorted by createdAt desc, filterable by status and date range, include total revenue calculation for "paid" payments in filtered set
    - `GET /api/admin/payments/:id` — full payment detail with Razorpay fields
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 5.4 Create admin analytics route
    - Create `src/server/routes/admin/analytics.ts`
    - `GET /api/admin/analytics` — accept `startDate` and `endDate` query params (default: today), max 90-day range
    - Compute: ordersPlaced count, ordersShipped count, totalTransactions (paid payments count), totalRevenue (sum of paid payment amounts), perProductRevenue (aggregation pipeline: unwind items, group by productId, sum price×quantity), dailyTrend (orders and revenue per day)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.7_

  - [x] 5.5 Mount all admin routes with auth middleware
    - Create `src/server/routes/admin/index.ts` that combines all admin route files
    - Apply `adminAuth` middleware to all routes except `/api/admin/login`
    - Mount in `server.ts` with `/api/admin` prefix
    - Add `cookie-parser` middleware to Express app
    - Serve `/uploads` directory statically
    - _Requirements: 12.1, 12.2, 12.3_

  - [ ]* 5.6 Write property tests for product validation and filtering
    - **Property 5: Product data round-trip**
    - **Property 6: Product validation rejects invalid data**
    - **Property 7: Stock quantity validation**
    - **Validates: Requirements 2.2, 2.7, 3.2, 3.3**

  - [ ]* 5.7 Write property tests for analytics and filtering
    - **Property 11: Filter correctness**
    - **Property 12: List ordering**
    - **Property 13: Revenue computation**
    - **Property 14: Analytics aggregation correctness**
    - **Validates: Requirements 4.7, 5.3, 5.4, 5.5, 6.1–6.5**

- [x] 6. Checkpoint - Ensure all backend routes compile and work
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Frontend: Razorpay checkout integration
  - [x] 7.1 Update Checkout.tsx with proper Razorpay flow
    - Remove Firestore import and usage from `Checkout.tsx`
    - Update `POST /api/payments/order` request body to include cart items, shipping address, and customer email (not just amount)
    - Use `VITE_RAZORPAY_KEY_ID` env var for the Razorpay key (or fallback to test key)
    - Set currency to INR, configure Razorpay modal with brand name "Zarevielle" and theme color `#5A5A40`
    - On payment success: call `POST /api/payments/verify` with `razorpay_payment_id`, `razorpay_order_id`, `razorpay_signature`
    - On verification success: clear cart, navigate to `/success`
    - On modal close/cancel: display message, keep form data, re-enable button
    - On SDK load failure: display "payment service unavailable" message
    - Show loading/disabled state on submit button during processing
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

  - [ ]* 7.2 Write unit tests for checkout flow
    - Test SDK load failure handling
    - Test form preservation on payment cancel
    - Test loading state during processing
    - _Requirements: 9.3, 9.4, 9.6_

- [x] 8. Frontend: Admin panel pages
  - [x] 8.1 Create admin auth context and login page
    - Create `src/admin/context/AdminAuthContext.tsx` with login, logout, checkSession functions
    - Create `src/admin/pages/AdminLogin.tsx` — login form with username/password fields, error display (generic message), loading state
    - Store session state (check via `GET /api/admin/session` on mount)
    - _Requirements: 1.1, 1.2, 1.3, 1.8_

  - [x] 8.2 Create admin layout and route guard
    - Create `src/admin/components/AdminLayout.tsx` — sidebar navigation (Dashboard, Products, Orders, Payments) + content area, responsive (no horizontal scroll ≥1024px), NO storefront Navbar/Footer
    - Create `src/admin/components/AdminAuthGuard.tsx` — redirect to `/admin/login` if not authenticated, handle session expiry (redirect within 5s of next action)
    - _Requirements: 12.1, 12.2, 12.6, 12.7_

  - [x] 8.3 Create admin dashboard (analytics) page
    - Create `src/admin/pages/Dashboard.tsx`
    - Display: orders placed today, orders shipped today, transactions count + total revenue, per-product revenue table
    - Add date range picker (max 90 days), refresh data every 60 seconds
    - Add line charts for orders-per-day and revenue-per-day trends (use a lightweight chart library or inline SVG)
    - Fetch from `GET /api/admin/analytics`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [x] 8.4 Create admin products page
    - Create `src/admin/pages/ProductList.tsx` — paginated table (20/page) with name, price, category, stock (low-stock indicator for <5), thumbnail, edit/delete actions
    - Create `src/admin/pages/ProductForm.tsx` — add/edit form with all fields: name, description, price, category, colors (add/remove with name + hex picker), image upload (drag-drop or file select, max 10, max 5MB each), stock, featured toggle
    - Field-level validation errors displayed inline
    - Delete confirmation dialog showing product name
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 3.1, 3.2, 3.3_

  - [x] 8.5 Create admin orders page
    - Create `src/admin/pages/OrderList.tsx` — paginated table (20/page), sorted newest first, columns: customer name, total, status (badge), date, filter by status dropdown, search by email/order ID
    - Create `src/admin/pages/OrderDetail.tsx` — full order view: items list, shipping address, payment info, status history timeline, status update dropdown (only valid next statuses shown), error on invalid transition
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.7, 4.8, 4.9_

  - [x] 8.6 Create admin payments page
    - Create `src/admin/pages/PaymentList.tsx` — paginated table (20/page), sorted by date desc, columns: transaction ID, amount, status, order ID, date, filter by status and date range, display total revenue for filtered "paid" payments
    - Create `src/admin/pages/PaymentDetail.tsx` — full payment view: Razorpay transaction details, payment method, currency, settlement status, linked order
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Wiring: Update App.tsx and product loading
  - [x] 9.1 Update App.tsx with admin routes
    - Add admin route group under `/admin/*` path — render AdminAuthGuard wrapping AdminLayout with nested routes (dashboard, products, orders, payments)
    - Ensure `/admin` routes do NOT render storefront Navbar/Footer
    - Add `/admin/login` route outside the guard
    - Import all admin page components
    - _Requirements: 12.1, 12.2_

  - [x] 9.2 Update storefront to load products from API
    - Update `src/pages/Collection.tsx` to fetch products from `GET /api/products` instead of importing from `initialProducts.ts`
    - Update `src/pages/Home.tsx` to fetch featured products from API (filter by `featured=true`)
    - Update `src/pages/ProductDetail.tsx` to fetch single product from `GET /api/products/:id`
    - Update `src/types.ts` — add `colors` array field to Product interface, keep `imageUrl` as primary image (first in images array)
    - Handle loading states and errors in each page
    - _Requirements: 2.1, 3.6, 3.7_

  - [x] 9.3 Update CartContext for stock validation
    - Modify `addToCart` in `CartContext.tsx` to check available stock before adding (fetch from API or use product data already loaded)
    - If requested quantity exceeds stock, cap at available stock and show notification
    - _Requirements: 3.7_

  - [x] 9.4 Update environment configuration
    - Update `.env.example` with all required env vars: `MONGODB_URI`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `VITE_RAZORPAY_KEY_ID`
    - Ensure `server.ts` imports and uses all new route modules
    - _Requirements: 8.1, 9.1_

- [x] 10. Final checkpoint - Ensure full application compiles and runs
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The backend uses Express.js with Mongoose (MongoDB), the frontend uses React + TypeScript + Vite + Tailwind
- Currency is INR throughout (Razorpay amounts in paise)
- Admin panel is fully separate from storefront (no shared layout components)
- Image uploads stored locally in `/uploads/products/` (can be swapped to cloud storage later)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5", "1.6"] },
    { "id": 2, "tasks": ["1.7", "2.1", "4.1"] },
    { "id": 3, "tasks": ["2.2", "2.3", "2.4", "4.2"] },
    { "id": 4, "tasks": ["2.5", "2.6", "4.3", "5.1", "5.2", "5.3", "5.4"] },
    { "id": 5, "tasks": ["5.5", "5.6", "5.7"] },
    { "id": 6, "tasks": ["7.1", "8.1"] },
    { "id": 7, "tasks": ["7.2", "8.2"] },
    { "id": 8, "tasks": ["8.3", "8.4", "8.5", "8.6"] },
    { "id": 9, "tasks": ["9.1", "9.2", "9.3", "9.4"] }
  ]
}
```
