# Implementation Plan: Backend API Separation

## Overview

This plan separates the monolithic `server.ts` into a standalone Express API service under `server/` and a typed frontend API client. Tasks are ordered to build foundational structure first, then middleware, then route handlers, then the frontend client, and finally integration wiring and cleanup.

## Tasks

- [ ] 1. Set up server directory structure and configuration
  - [ ] 1.1 Initialize server project with package.json and tsconfig.json
    - Create `server/` directory with its own `package.json` listing dependencies: express, dotenv, razorpay, firebase-admin, cors, typescript, vitest, fast-check, tsx, @types/express, @types/node
    - Create `server/tsconfig.json` with strict mode, ES module output, and `dist/` outDir
    - Create `server/.env.example` listing all required and optional env vars with comments
    - Add dev and build scripts to server/package.json (dev: tsx watch, build: tsc)
    - _Requirements: 1.1, 1.3, 1.6, 10.3_

  - [ ] 1.2 Implement environment configuration and validation
    - Create `server/src/config/env.ts` with `EnvConfig` interface and `loadAndValidateEnv()` function
    - Validate required vars: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, FIREBASE_PROJECT_ID, ALLOWED_ORIGINS
    - Validate PORT as integer 1-65535, default to 3000
    - Exit with non-zero code and log missing variable names if validation fails
    - Load .env file with dotenv, log warning if file missing
    - _Requirements: 1.4, 1.5, 10.1, 10.2_

  - [ ] 1.3 Initialize Firebase Admin SDK configuration
    - Create `server/src/config/firebase.ts` that initializes Firebase Admin with project ID from env config
    - Export auth and firestore instances for use by middleware and services
    - _Requirements: 4.1, 4.6_

  - [ ] 1.4 Create Express app factory and entry point
    - Create `server/src/app.ts` with `createApp()` function that configures Express (json body parser with 1MB limit, CORS, routes, error handler)
    - Create `server/src/index.ts` entry point that calls loadAndValidateEnv(), creates app, and starts listening
    - _Requirements: 1.1, 2.1, 8.1_

- [ ] 2. Implement middleware layer
  - [ ] 2.1 Implement CORS middleware
    - Create `server/src/middleware/cors.ts` with `configureCors()` function
    - Read ALLOWED_ORIGINS from env config, split by comma
    - Allow requests from listed origins, return 403 for disallowed origins
    - Handle preflight OPTIONS with 204, appropriate headers, and Access-Control-Max-Age of 86400
    - Pass through requests without Origin header
    - Allow methods: GET, POST, PUT, DELETE, OPTIONS
    - Allow headers: Content-Type, Authorization, X-Request-ID
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 2.2 Write property test for CORS middleware
    - **Property 8: CORS origin filtering**
    - **Validates: Requirements 5.1, 5.2**

  - [ ] 2.3 Implement authentication middleware
    - Create `server/src/middleware/auth.ts` with `authMiddleware` function
    - Extract Bearer token from Authorization header
    - Verify token with Firebase Admin SDK verifyIdToken
    - Attach decoded user (uid, email) to request object
    - Return 401 for missing/malformed header, expired token, or invalid token with appropriate messages
    - Return 503 if Firebase Admin SDK is unreachable
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [ ]* 2.4 Write property tests for authentication middleware
    - **Property 6: Valid auth tokens grant access**
    - **Property 7: Invalid auth tokens are rejected**
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [ ] 2.5 Implement request validation middleware
    - Create `server/src/middleware/validation.ts` with `validate(schema)` factory function
    - Define ValidationSchema interface with field rules (required, type, min, max, maxLength, pattern, custom)
    - Return 400 with `{ error, fields[] }` on validation failure
    - _Requirements: 8.1, 8.2_

  - [ ]* 2.6 Write property test for validation middleware
    - **Property 1: Input validation returns structured 400 errors**
    - **Validates: Requirements 2.4, 3.4, 3.5, 8.2, 8.5**

  - [ ] 2.7 Implement global error handler middleware
    - Create `server/src/middleware/errorHandler.ts` with error handler function
    - Log full error details server-side (timestamp, method, path, error, stack, request-id)
    - Return 500 with generic `{ error: "Internal server error" }` — never expose internals
    - Handle malformed JSON body parsing errors with 400
    - _Requirements: 2.5, 8.3, 8.4, 8.5_

  - [ ]* 2.8 Write property test for error handler
    - **Property 2: Server errors never expose internal details**
    - **Validates: Requirements 2.5, 8.3, 8.4**

- [ ] 3. Checkpoint - Middleware layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement route handlers and services
  - [ ] 4.1 Create server-side types
    - Create `server/src/types/index.ts` with all request/response/internal types as defined in design
    - Include: CreatePaymentOrderRequest, VerifyPaymentRequest, CreateOrderRecordRequest, OrderItemData, ShippingAddress, PaymentOrderResponse, PaymentVerifyResponse, OrderRecordResponse, HealthResponse, ApiErrorResponse, FieldError, OrderRecord, DecodedUser
    - _Requirements: 3.1, 3.2, 9.1_

  - [ ] 4.2 Implement health route
    - Create `server/src/routes/health.ts` with GET handler returning `{ status: "ok", timestamp }` 
    - No authentication required
    - _Requirements: 2.3, 4.4_

  - [ ]* 4.3 Write property test for non-existent endpoints
    - **Property 3: Non-existent endpoints return 404**
    - **Validates: Requirements 2.6**

  - [ ] 4.4 Implement Razorpay service
    - Create `server/src/services/razorpay.ts` with RazorpayService class
    - Implement `createOrder(amount, currency)` with 10-second timeout via AbortController
    - Implement `verifySignature(orderId, paymentId, signature)` using HMAC-SHA256
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.5 Implement payments route handlers
    - Create `server/src/routes/payments.ts` with POST /orders and POST /verify handlers
    - Apply authMiddleware and validation schemas to both endpoints
    - Validate amount (1.00–999,999.99), currency (USD, INR)
    - Validate verify request fields (razorpay_order_id, razorpay_payment_id, razorpay_signature)
    - Return 503 on Razorpay timeout/unavailability
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.5_

  - [ ]* 4.6 Write property tests for payment processing
    - **Property 4: Payment order creation produces valid response**
    - **Property 5: Signature verification correctness**
    - **Validates: Requirements 3.1, 3.2, 3.6**

  - [ ] 4.7 Implement order service
    - Create `server/src/services/orderService.ts` with OrderService class
    - Implement `createOrder(data, userId)` that persists to Firestore with status "paid", userId, and createdAt timestamp
    - Handle Firestore failures with appropriate error logging
    - _Requirements: 9.1, 9.4, 9.5_

  - [ ] 4.8 Implement orders route handler
    - Create `server/src/routes/orders.ts` with POST / handler
    - Apply authMiddleware and validation schema
    - Validate: items (1-50 entries), totalAmount (> 0), customerEmail (valid email), shippingAddress fields (non-empty, max 200 chars)
    - Return created order ID on success
    - _Requirements: 9.1, 9.2, 9.3, 9.5_

  - [ ]* 4.9 Write property tests for order management
    - **Property 11: Order creation persists all required fields**
    - **Property 12: Invalid orders are rejected without persistence**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.5**

  - [ ] 4.10 Create route aggregator
    - Create `server/src/routes/index.ts` that mounts all routers under `/api/v1` prefix
    - Mount health at `/api/v1/health`, payments at `/api/v1/payments`, orders at `/api/v1/orders`
    - Add 404 catch-all for unmatched `/api/v1` routes
    - _Requirements: 2.1, 2.2, 2.6_

- [ ] 5. Checkpoint - Backend API complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement frontend API client and configuration
  - [ ] 6.1 Create typed API client module
    - Create `src/lib/apiClient.ts` with ApiClient class
    - Implement `createPaymentOrder(data)`, `verifyPayment(data)`, `healthCheck()` methods
    - Read base URL from `import.meta.env.VITE_API_URL`, throw if missing
    - Attach Firebase Bearer token to all authenticated requests
    - Implement 30-second request timeout with AbortController
    - Implement token refresh and single retry on 401
    - Map non-2xx responses to typed ApiError objects
    - Export singleton `apiClient` instance
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 6.2 Write property tests for API client
    - **Property 9: API client attaches auth token to requests**
    - **Property 10: API client maps non-2xx responses to typed errors**
    - **Validates: Requirements 6.2, 6.3**

  - [ ] 6.3 Update Vite config with API proxy
    - Update `vite.config.ts` to proxy `/api` requests to `http://localhost:3000` during development
    - Ensure existing HMR and watch settings are preserved
    - _Requirements: 7.2, 7.5_

  - [ ] 6.4 Update frontend environment configuration
    - Add `VITE_API_URL` and `VITE_RAZORPAY_KEY_ID` to `.env.example`
    - _Requirements: 10.4, 10.5_

- [ ] 7. Checkpoint - Frontend client complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Integration wiring and cleanup
  - [ ] 8.1 Update Checkout page to use API client
    - Refactor `src/pages/Checkout.tsx` to use `apiClient.createPaymentOrder()` instead of direct fetch to `/api/payments/order`
    - Use `apiClient` for order creation after payment verification instead of direct Firestore writes
    - Use `VITE_RAZORPAY_KEY_ID` env var for Razorpay key instead of hardcoded value
    - _Requirements: 6.1, 6.2_

  - [ ]* 8.2 Write property test for environment validation
    - **Property 13: Environment validation completeness**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 8.3 Write unit tests for key components
    - Test health endpoint response shape
    - Test auth middleware specific scenarios (missing header, expired token, Firebase unavailable)
    - Test CORS preflight response headers
    - Test API client initialization failure
    - Test Razorpay service timeout handling
    - _Requirements: 2.3, 4.4, 4.5, 4.6, 5.5, 6.4, 3.3_

  - [ ] 8.4 Remove old server.ts and update root package.json
    - Delete the root `server.ts` file
    - Update root `package.json` scripts: change "dev" to run only Vite frontend, add "dev:server" script pointing to server directory
    - Remove server-only dependencies from root package.json (razorpay, express, @types/express can move to server)
    - _Requirements: 1.2, 7.1_

- [ ] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript throughout, consistent with the existing codebase
- fast-check is used for property-based testing, Vitest as the test runner
- All external services (Razorpay, Firebase) should be mocked in tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "4.1"] },
    { "id": 2, "tasks": ["1.4", "2.1", "2.3", "2.5", "2.7"] },
    { "id": 3, "tasks": ["2.2", "2.4", "2.6", "2.8", "4.2", "4.4"] },
    { "id": 4, "tasks": ["4.3", "4.5", "4.7", "4.10"] },
    { "id": 5, "tasks": ["4.6", "4.8"] },
    { "id": 6, "tasks": ["4.9", "6.1", "6.3", "6.4"] },
    { "id": 7, "tasks": ["6.2", "8.1", "8.2"] },
    { "id": 8, "tasks": ["8.3", "8.4"] }
  ]
}
```
