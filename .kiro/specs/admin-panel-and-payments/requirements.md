# Requirements Document

## Introduction

This document defines the requirements for the Admin Panel and Payments feature of the Zarevielle e-commerce web application. The feature encompasses three major areas: (1) a secure admin panel for managing products, inventory, orders, and viewing analytics; (2) MongoDB data models for products, orders, payments, and admin users; and (3) full Razorpay payment gateway integration with the existing cart and checkout flow. The system uses a React/TypeScript frontend with Vite, an Express.js backend, and MongoDB for persistence.

## Glossary

- **Admin_Panel**: A separate, password-protected web interface accessible only to authenticated admin users for managing the Zarevielle store
- **Admin_User**: A user with administrative privileges who authenticates via username and password to access the Admin_Panel
- **Product**: A merchandise item in the Zarevielle store with attributes including name, description, price, category, colors, images, and stock quantity
- **Order**: A customer purchase record containing items, shipping details, payment information, and delivery status
- **Payment**: A financial transaction processed through Razorpay associated with an Order
- **Razorpay_Gateway**: The Razorpay payment processing service used to create orders, process payments, and verify transactions
- **Cart**: The frontend shopping cart managed by CartContext that holds items a customer intends to purchase
- **Checkout_Flow**: The end-to-end process from cart review through payment completion and order confirmation
- **Webhook**: An HTTP callback from Razorpay to the backend server that notifies of payment status changes
- **Analytics_Dashboard**: A section of the Admin_Panel displaying daily metrics for orders, shipments, transactions, and revenue
- **MongoDB**: The NoSQL database used for persisting all application data
- **Session**: An authenticated admin login session maintained via a secure token

## Requirements

### Requirement 1: Admin Authentication

**User Story:** As an admin, I want to log in with a username and password on a separate endpoint, so that only authorized personnel can access store management features.

#### Acceptance Criteria

1. WHEN an admin navigates to the admin login page, THE Admin_Panel SHALL display a login form requesting a username (between 3 and 64 characters) and a password (between 8 and 128 characters)
2. WHEN credentials matching a stored Admin_User record are submitted, THE Admin_Panel SHALL authenticate the Admin_User and create a server-side Session identified by an opaque token stored in an HTTP-only, secure cookie
3. WHEN credentials that do not match any stored Admin_User record are submitted, THE Admin_Panel SHALL display a generic error message indicating that the username or password is incorrect, without revealing which field failed validation
4. WHILE an Admin_User is not authenticated, THE Admin_Panel SHALL redirect all admin routes to the login page
5. WHEN an Admin_User clicks logout, THE Admin_Panel SHALL invalidate the Session on the server and redirect to the login page
6. THE Admin_Panel SHALL store passwords using bcrypt hashing with a minimum cost factor of 10
7. WHEN a Session has received no authenticated request for 24 hours, THE Admin_Panel SHALL automatically expire the Session and require re-authentication
8. IF an Admin_User submits 5 consecutive failed login attempts within a 15-minute window, THEN THE Admin_Panel SHALL lock the account for 15 minutes and display a message indicating the account is temporarily locked

### Requirement 2: Product Management

**User Story:** As an admin, I want to add, edit, and manage product items with colors and images, so that I can maintain the store catalog.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to the product management section, THE Admin_Panel SHALL display a paginated list of all Products showing name, price, category, stock quantity, and thumbnail image, with a maximum of 20 products per page
2. WHEN an Admin_User submits the add product form with valid data, THE Admin_Panel SHALL create a new Product in MongoDB with name (1–100 characters), description (1–2000 characters), price (0.01 to 999,999,999.99), category, colors array (0–20 entries), images array (1–10 URLs), stock quantity (0–99,999), and featured status
3. WHEN an Admin_User edits a Product and submits valid changes, THE Admin_Panel SHALL update the corresponding Product document in MongoDB and display the updated values in the product list
4. WHEN an Admin_User adds colors to a Product, THE Admin_Panel SHALL store each color as a named entry (1–50 characters) with an associated valid hex code (format: #RRGGBB), up to a maximum of 20 colors per Product
5. WHEN an Admin_User uploads images for a Product, THE Admin_Panel SHALL accept up to 10 image files per Product, each no larger than 5 MB, in JPEG, PNG, or WebP format, and store their URLs in the Product document
6. WHEN an Admin_User requests deletion of a Product, THE Admin_Panel SHALL display a confirmation dialog stating the Product name before deletion, and only remove the Product from MongoDB after the Admin_User confirms
7. IF a Product creation or update fails validation, THEN THE Admin_Panel SHALL display field-level error messages identifying each invalid field and the reason for rejection (missing required value, exceeds length limit, or invalid format), and SHALL preserve the Admin_User's entered data in the form
8. IF an image upload fails due to invalid file type, file size exceeding 5 MB, or a server error, THEN THE Admin_Panel SHALL display an error message indicating the cause of failure and SHALL not save the Product until valid images are provided or the failed upload is removed

### Requirement 3: Inventory Management

**User Story:** As an admin, I want to track and update product inventory levels, so that I can prevent overselling and manage stock.

#### Acceptance Criteria

1. WHEN an Admin_User views inventory, THE Admin_Panel SHALL display all Products with their current stock quantities and a visual indicator for low-stock items (stock below 5 units)
2. WHEN an Admin_User updates a Product stock quantity, THE Admin_Panel SHALL validate the input as a whole number between 0 and 10,000 and persist the new quantity to MongoDB within 2 seconds of submission
3. IF an Admin_User submits a stock quantity that is not a whole number between 0 and 10,000, THEN THE Admin_Panel SHALL reject the update and display an inline error message indicating the valid range
4. WHEN a Payment is confirmed for an Order, THE System SHALL atomically decrement the stock quantity of each ordered Product by the purchased quantity, ensuring the resulting stock does not fall below zero
5. IF a stock decrement would result in a negative quantity (due to concurrent purchases), THEN THE System SHALL reject the order, not decrement stock, and display a notification to the customer indicating that one or more items are no longer available in the requested quantity
6. IF a Product stock reaches zero after decrement, THEN THE System SHALL mark the Product as out-of-stock on the storefront and prevent further add-to-cart actions for that Product
7. IF a customer attempts to add a quantity exceeding available stock, THEN THE Cart SHALL limit the quantity to the current available stock and display a notification visible for at least 5 seconds indicating the maximum available quantity

### Requirement 4: Order Management

**User Story:** As an admin, I want to view all orders and update their delivery status, so that I can track fulfillment and keep customers informed.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to the orders section, THE Admin_Panel SHALL display Orders sorted by creation date in descending order (newest first), showing customer name, total amount, status, and date, paginated at 20 orders per page
2. WHEN an Admin_User views an Order detail, THE Admin_Panel SHALL display all order items, shipping address, payment information, and status history
3. WHEN an Admin_User updates an Order status to a valid next status, THE Admin_Panel SHALL persist the new status to MongoDB with a timestamp and display a confirmation message indicating the status was saved
4. THE System SHALL support the following Order statuses: placed, confirmed, shipped, out-for-delivery, delivered, cancelled
5. THE System SHALL enforce the following valid status transitions: placed → confirmed, confirmed → shipped, shipped → out-for-delivery, out-for-delivery → delivered, and any non-delivered status → cancelled
6. WHEN an Order status changes to shipped, THE System SHALL record the shipment date on the Order document
7. WHEN an Admin_User filters orders by status, THE Admin_Panel SHALL display only Orders matching the selected status, or display an empty-state message indicating no orders match if none exist
8. WHEN an Admin_User searches orders by customer email or order ID, THE Admin_Panel SHALL return matching Orders within 500 milliseconds
9. IF an Admin_User attempts an invalid status transition, THEN THE Admin_Panel SHALL reject the update and display an error message indicating the allowed next statuses for the current order status

### Requirement 5: Payment Tracking

**User Story:** As an admin, I want to view all payments and transactions received, so that I can reconcile revenue and monitor financial activity.

#### Acceptance Criteria

1. WHEN an Admin_User navigates to the payments section, THE Admin_Panel SHALL display Payments in a paginated list (20 items per page) sorted by date descending, showing transaction ID, amount, status, associated Order ID, and date for each entry
2. WHEN an Admin_User views a Payment detail, THE Admin_Panel SHALL display the Razorpay transaction details including payment method, currency, settlement status, and Razorpay order ID
3. WHEN an Admin_User filters payments by date range, THE Admin_Panel SHALL display only Payments whose transaction date falls within the specified start and end dates (inclusive)
4. WHEN an Admin_User filters payments by status (paid, failed, pending), THE Admin_Panel SHALL display only Payments matching the selected status
5. THE Admin_Panel SHALL display the total revenue amount calculated as the sum of amounts for Payments with "paid" status within the currently filtered Payment set
6. IF the Admin_Panel fails to retrieve payment data from the payment provider, THEN THE Admin_Panel SHALL display an error message indicating that payment information is temporarily unavailable and retain any previously applied filter selections

### Requirement 6: Analytics Dashboard

**User Story:** As an admin, I want to see daily analytics showing orders, shipments, transactions, and per-product revenue, so that I can make informed business decisions.

#### Acceptance Criteria

1. WHEN an Admin_User opens the Analytics_Dashboard, THE Admin_Panel SHALL display the count of Orders placed for the current day (from 00:00:00 to 23:59:59 in the server's timezone)
2. WHEN an Admin_User opens the Analytics_Dashboard, THE Admin_Panel SHALL display the count of Orders with status "shipped" for the current day
3. WHEN an Admin_User opens the Analytics_Dashboard, THE Admin_Panel SHALL display the count and total amount (in INR) of transactions with status "paid" processed for the current day
4. WHEN an Admin_User opens the Analytics_Dashboard, THE Admin_Panel SHALL display revenue generated per Product for the current day, showing product name and total amount earned
5. WHEN an Admin_User selects a date range on the Analytics_Dashboard (maximum range of 90 days), THE Admin_Panel SHALL recalculate and display all metrics for the selected range within 5 seconds
6. THE Analytics_Dashboard SHALL refresh data every 60 seconds while the page is active without requiring a full page reload
7. THE Analytics_Dashboard SHALL display metrics using line charts for orders-per-day and revenue-per-day trends over the selected range

### Requirement 7: MongoDB Data Models

**User Story:** As a developer, I want well-structured MongoDB schemas for products, orders, payments, admin users, and analytics, so that data is consistent and queryable.

#### Acceptance Criteria

1. THE System SHALL define a Product schema containing: id, name (maximum 100 characters), description (maximum 1000 characters), price (numeric, range 0.01 to 999999.99), category (string, maximum 50 characters), colors (array of objects with name and hexCode, maximum 20 entries), images (array of URL strings, maximum 10 entries), stock (integer, minimum 0), featured (boolean), createdAt, and updatedAt timestamps
2. THE System SHALL define an Order schema containing: id, userId, customerEmail, items (array of OrderItem where each item contains productId, name, price, quantity, and imageUrl), totalAmount (numeric, range 0.01 to 999999.99), status (one of: placed, confirmed, shipped, out-for-delivery, delivered, cancelled), shippingAddress (object with fullName, address, city, and zipCode), paymentId, razorpayOrderId, statusHistory (array of objects each containing status and changedAt timestamp, maximum 20 entries), createdAt, and updatedAt
3. THE System SHALL define a Payment schema containing: id, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature, amount (numeric, range 0.01 to 999999.99), currency (string, 3-character ISO 4217 code), status (one of: pending, paid, failed, refunded), method (string, maximum 50 characters), customerEmail, and createdAt
4. THE System SHALL define an Admin_User schema containing: id, username (unique, 3 to 50 characters), passwordHash, lastLoginAt, and createdAt
5. THE System SHALL define a DailyAnalytics schema containing: date (unique, one record per calendar day), ordersPlaced (integer, minimum 0), ordersShipped (integer, minimum 0), totalTransactions (integer, minimum 0), totalRevenue (numeric, minimum 0), and perProductRevenue (array of objects each containing productId and amount)
6. THE System SHALL create MongoDB indexes on Order.status, Order.createdAt, Payment.status, Payment.createdAt, and Product.category for query performance
7. IF a required field defined in any schema is missing or fails its type or range constraint, THEN THE System SHALL reject the document and return a validation error indicating which field failed validation
8. WHEN an Order status field is updated, THE System SHALL append a new entry to the statusHistory array containing the new status value and the timestamp of the change

### Requirement 8: Razorpay Order Creation

**User Story:** As a customer, I want the system to create a Razorpay order when I proceed to checkout, so that my payment is properly tracked and secured.

#### Acceptance Criteria

1. WHEN a customer submits the checkout form with a non-empty cart, THE System SHALL create a Razorpay order via the Razorpay API with the cart total amount converted to the smallest currency unit (paise for INR), where the amount is between 100 (₹1) and 99999999 (₹9,99,999.99)
2. WHEN the Razorpay order is created successfully, THE System SHALL store the order ID, cart items, total amount, customer email, shipping address, and status "pending" in MongoDB within 5 seconds of receiving the Razorpay response
3. WHEN the Razorpay order is created successfully, THE System SHALL return the Razorpay order ID, amount in smallest currency unit, and currency code to the frontend within 10 seconds of the customer's checkout submission
4. IF the Razorpay order creation fails or the Razorpay API does not respond within 30 seconds, THEN THE System SHALL return an error message indicating that order creation failed to the frontend and log the error type, timestamp, and requested amount
5. THE System SHALL include a unique receipt identifier with each Razorpay order, formatted as a string of no more than 40 characters that is unique per order for reconciliation
6. IF the customer submits the checkout form with an empty cart, THEN THE System SHALL reject the request and display a message indicating that the cart is empty without calling the Razorpay API

### Requirement 9: Razorpay Payment Processing

**User Story:** As a customer, I want to complete payment through Razorpay's checkout interface, so that I can securely pay for my order.

#### Acceptance Criteria

1. WHEN the frontend receives a Razorpay order ID, THE Checkout_Flow SHALL open the Razorpay checkout modal configured with the order amount, order ID, currency, customer prefill data (name and email from the checkout form), and Zarevielle brand name and theme color
2. WHEN the customer completes payment successfully, THE Checkout_Flow SHALL send the payment response (razorpay_payment_id, razorpay_order_id, razorpay_signature) to the backend verification endpoint before proceeding with order creation
3. WHEN the customer cancels or closes the Razorpay modal, THE Checkout_Flow SHALL display a message indicating payment was not completed and keep the checkout form populated with the previously entered data so the customer can retry by resubmitting
4. WHILE payment is being processed (from checkout form submission until the Razorpay modal opens or an error occurs), THE Checkout_Flow SHALL display a loading state by disabling the submit button and showing a processing label
5. WHEN payment is verified successfully by the backend, THE Checkout_Flow SHALL save the order record (including customer details, cart items, total amount, shipping address, and payment ID) to the database, clear the cart, and navigate to the success page
6. IF the Razorpay SDK fails to load, THEN THE Checkout_Flow SHALL display a message indicating the payment service is unavailable, re-enable the submit button, and not open the checkout modal
7. IF the backend order creation request fails or returns an error, THEN THE Checkout_Flow SHALL display a message indicating the order could not be initiated, re-enable the submit button, and not open the checkout modal

### Requirement 10: Razorpay Payment Verification

**User Story:** As a system operator, I want all payments to be cryptographically verified, so that fraudulent transactions are rejected.

#### Acceptance Criteria

1. WHEN the backend receives a payment verification request, THE System SHALL compute an HMAC SHA256 signature using the Razorpay key secret with the concatenation of razorpay_order_id + "|" + razorpay_payment_id (pipe-separated)
2. WHEN the computed signature matches the razorpay_signature from the request, THE System SHALL mark the Payment status as "paid" in MongoDB and store the razorpay_payment_id on the Order record
3. IF the computed signature does not match the razorpay_signature, THEN THE System SHALL mark the Payment status as "failed" in MongoDB, leave the associated Order status unchanged, and return an error response indicating signature verification failure
4. WHEN payment verification succeeds, THE System SHALL update the associated Order status to "paid"
5. WHEN payment verification succeeds, THE System SHALL decrement the stock field by the ordered quantity for each product in the Order, and SHALL NOT decrement stock below zero
6. IF the payment verification request is missing any of the required fields (razorpay_order_id, razorpay_payment_id, or razorpay_signature), THEN THE System SHALL reject the request and return an error response indicating the missing fields without performing signature computation
7. IF the associated Order cannot be found in MongoDB after successful signature verification, THEN THE System SHALL log the orphaned payment event and return an error response indicating the Order was not found

### Requirement 11: Razorpay Webhook Handling

**User Story:** As a system operator, I want to receive and process Razorpay webhooks, so that payment status is updated even if the customer's browser session is interrupted.

#### Acceptance Criteria

1. THE System SHALL expose a webhook endpoint at /api/payments/webhook that accepts POST requests from Razorpay
2. WHEN a webhook request is received, THE System SHALL verify the webhook signature using the Razorpay webhook secret before processing
3. WHEN a payment.captured event is received with a valid signature, THE System SHALL update the Payment status to "paid" and the Order status to "confirmed" in MongoDB
4. WHEN a payment.failed event is received with a valid signature, THE System SHALL update the Payment status to "failed" in MongoDB
5. IF webhook signature verification fails, THEN THE System SHALL reject the request with a 400 status code and log the attempt including the request IP and timestamp
6. THE System SHALL respond to valid webhook requests with a 200 status code within 5 seconds to prevent Razorpay retries
7. THE System SHALL handle duplicate webhook events idempotently by checking if the payment status has already been updated before making changes

### Requirement 12: Admin Panel Routing and Access Control

**User Story:** As a system operator, I want the admin panel served on a separate route with its own authentication, so that it is isolated from the customer-facing storefront.

#### Acceptance Criteria

1. THE System SHALL serve the Admin_Panel on the /admin route prefix, separate from the customer storefront, such that no storefront layout components (Navbar, Footer) are rendered on /admin routes
2. WHILE an Admin_User is authenticated, THE Admin_Panel SHALL provide navigation to: Dashboard (analytics), Products, Orders, Payments sections
3. THE System SHALL protect all /admin API routes with authentication middleware that validates the admin session token for presence, valid signature, unexpired status, and admin role claim
4. IF an unauthenticated request is made to any /admin API route, THEN THE System SHALL return a 401 status code and not disclose whether the route exists
5. IF a request with a valid session token but without the admin role claim is made to any /admin API route, THEN THE System SHALL return a 403 status code
6. IF an admin session token expires while the Admin_User is interacting with the Admin_Panel, THEN THE System SHALL redirect the Admin_User to the admin login view within 5 seconds of the next user-initiated action
7. THE Admin_Panel SHALL use a responsive layout where all navigation items and content sections remain visible and interactive without horizontal scrolling on viewports of 1024 pixels width and above
