# Requirements Document

## Introduction

This specification defines the requirements for separating the backend API from the frontend in the Zarevielle e-commerce application. Currently, the application uses a single `server.ts` file that serves both the Vite development middleware (frontend) and the Express API routes (payments). The goal is to extract the backend into a standalone API service with clear boundaries, proper project structure, authentication middleware, and independent deployment capability — while the frontend communicates with it via well-defined HTTP endpoints.

## Glossary

- **API_Server**: The standalone Express.js backend service responsible for handling payment processing, order management, and server-side business logic
- **Frontend_App**: The React single-page application built with Vite that serves the user interface and communicates with the API_Server over HTTP
- **Payment_Gateway**: The Razorpay integration that handles order creation and payment verification on the server side
- **Auth_Middleware**: The server-side middleware that validates Firebase ID tokens to authenticate incoming API requests
- **API_Client**: The frontend module that encapsulates all HTTP calls to the API_Server, providing a typed interface for the Frontend_App
- **CORS_Policy**: The Cross-Origin Resource Sharing configuration that controls which origins can access the API_Server

## Requirements

### Requirement 1: Project Structure Separation

**User Story:** As a developer, I want the backend API to live in its own directory with independent configuration, so that I can develop, test, and deploy it separately from the frontend.

#### Acceptance Criteria

1. THE API_Server SHALL reside in a dedicated `server/` directory at the project root containing its own `package.json`, `tsconfig.json`, and a TypeScript entry point file that bootstraps the Express application
2. THE Frontend_App SHALL reside in the existing project root (or a dedicated `client/` directory) with its own Vite configuration and SHALL NOT contain import statements or path references that resolve to modules inside the `server/` directory
3. THE API_Server SHALL use its own `package.json` that lists all runtime and dev dependencies required to build and run the server, with no requirement that the Frontend_App's `package.json` be installed first
4. WHEN the API_Server starts, THE API_Server SHALL load environment variables from a `.env` file located in the `server/` directory using the dotenv package
5. IF the `.env` file is missing or unreadable when the API_Server starts, THEN THE API_Server SHALL log a warning message to standard output and continue startup using any environment variables already present in the process environment
6. WHEN a developer runs `npm install` and `npm run build` inside the `server/` directory, THE API_Server SHALL complete the build successfully without requiring files or dependencies from the Frontend_App directory

### Requirement 2: API Route Architecture

**User Story:** As a developer, I want the backend to expose a well-structured RESTful API with versioned endpoints, so that the frontend can consume them reliably and the API can evolve without breaking clients.

#### Acceptance Criteria

1. THE API_Server SHALL expose all endpoints under a `/api/v1` base path
2. THE API_Server SHALL expose routes grouped by domain, with each domain (payments, orders, health) accessible as a distinct path segment under the base path (e.g., `/api/v1/payments`, `/api/v1/orders`, `/api/v1/health`)
3. WHEN a request is made to `/api/v1/health`, THE API_Server SHALL respond within 2 seconds with HTTP status 200 and a JSON object containing a `status` field with value `"ok"` and a `timestamp` field with an ISO 8601 formatted string
4. IF a request fails due to invalid input, THEN THE API_Server SHALL return HTTP status 400 with a JSON body containing an `error` field describing the validation failure
5. IF a request fails due to a server-side error, THEN THE API_Server SHALL return HTTP status 500 with a JSON body containing an `error` field indicating an internal failure, without exposing internal details
6. IF a request is made to a non-existent endpoint under `/api/v1`, THEN THE API_Server SHALL return HTTP status 404 with a JSON body containing an `error` field indicating the resource was not found

### Requirement 3: Payment Processing Endpoints

**User Story:** As a customer, I want the payment flow to work through dedicated backend endpoints, so that my payment credentials and order amounts are validated server-side.

#### Acceptance Criteria

1. WHEN a POST request is received at `/api/v1/payments/orders` containing an `amount` (positive number between 1.00 and 999,999.99) and an optional `currency` field, THE API_Server SHALL create a Razorpay order with the amount converted to subunits and return a JSON response containing the order `id`, `amount`, and `currency`
2. WHEN a POST request is received at `/api/v1/payments/verify` containing `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`, THE API_Server SHALL verify the Razorpay signature using HMAC-SHA256 and return a JSON response containing a `status` field indicating success or failure
3. IF the Razorpay service is unavailable or does not respond within 10 seconds, THEN THE API_Server SHALL return a 503 status code with a JSON body containing an error message indicating service unavailability
4. IF the order creation request contains an amount that is missing, non-numeric, zero, or negative, THEN THE API_Server SHALL return a 400 status code with a JSON body containing an error message indicating the validation failure reason
5. IF the currency field is provided and is not a supported ISO 4217 code (at minimum USD and INR), THEN THE API_Server SHALL return a 400 status code with a JSON body containing an error message indicating the unsupported currency
6. IF the payment verification request contains an invalid signature (HMAC-SHA256 mismatch), THEN THE API_Server SHALL return a 400 status code with a JSON body containing an error message indicating signature verification failure

### Requirement 4: Authentication and Authorization

**User Story:** As a developer, I want the API to verify Firebase authentication tokens, so that protected endpoints are only accessible to authenticated users.

#### Acceptance Criteria

1. WHEN a request includes a valid `Authorization: Bearer <token>` header, THE Auth_Middleware SHALL validate the token using Firebase Admin SDK and attach the decoded user information (including at minimum the user's UID) to the request object before passing control to the next handler
2. IF a request to a protected endpoint is missing the `Authorization` header or the header value does not follow the `Bearer <token>` format, THEN THE Auth_Middleware SHALL return a 401 status code with an error message indicating that authentication credentials are missing or malformed
3. IF the provided token is expired, THEN THE Auth_Middleware SHALL return a 401 status code with an error message indicating token expiration; IF the token is malformed or fails signature verification, THEN THE Auth_Middleware SHALL return a 401 status code with an error message indicating an invalid token
4. THE API_Server SHALL allow the `/api/v1/health` endpoint to be accessed without authentication
5. THE API_Server SHALL require authentication for the `/api/v1/payments/orders` and `/api/v1/payments/verify` endpoints
6. IF the Firebase Admin SDK fails to initialize or is unreachable during token validation, THEN THE Auth_Middleware SHALL return a 503 status code with an error message indicating that the authentication service is temporarily unavailable

### Requirement 5: CORS Configuration

**User Story:** As a developer, I want the API to have proper CORS settings, so that only the authorized frontend origin can make requests to the backend.

#### Acceptance Criteria

1. THE API_Server SHALL configure CORS to allow requests only from origins specified in the `CORS_ALLOWED_ORIGINS` environment variable, where multiple origins are separated by commas
2. IF a request includes an `Origin` header that does not match any value in `CORS_ALLOWED_ORIGINS`, THEN THE API_Server SHALL reject the request with a 403 status code and an empty response body
3. THE CORS_Policy SHALL allow the HTTP methods GET, POST, PUT, DELETE, and OPTIONS
4. THE CORS_Policy SHALL allow the headers `Content-Type`, `Authorization`, and `X-Request-ID`
5. WHEN the API_Server receives a preflight OPTIONS request from an allowed origin, THE API_Server SHALL respond with a 204 status code and include the appropriate CORS headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`) with a preflight cache duration (`Access-Control-Max-Age`) of 86400 seconds
6. IF a request does not include an `Origin` header, THEN THE API_Server SHALL process the request without appending CORS response headers

### Requirement 6: Frontend API Client

**User Story:** As a frontend developer, I want a typed API client module that handles all communication with the backend, so that API calls are centralized and type-safe.

#### Acceptance Criteria

1. THE API_Client SHALL provide typed functions for each API endpoint: order creation (POST /api/v1/payments/orders), payment verification (POST /api/v1/payments/verify), and health check (GET /api/v1/health), where each function defines TypeScript types for its request parameters and response payload
2. WHEN the user is authenticated, THE API_Client SHALL attach the Firebase ID token as a Bearer token in the Authorization header for all requests to authenticated endpoints
3. IF an API call returns a non-2xx status code, THEN THE API_Client SHALL throw a typed error object containing the HTTP status code (number) and the error message string parsed from the response body
4. IF the `VITE_API_URL` environment variable is not defined, THEN THE API_Client SHALL throw an error at initialization indicating the missing configuration
5. WHEN the Firebase ID token is expired and an API request is attempted, THE API_Client SHALL request a refreshed token from Firebase and retry the original request exactly once
6. IF the token refresh fails or the retried request after token refresh returns a non-2xx status code, THEN THE API_Client SHALL throw a typed error without further retry attempts
7. THE API_Client SHALL enforce a request timeout of 30 seconds per API call, after which it SHALL abort the request and throw a typed error indicating a timeout

### Requirement 7: Independent Development and Build

**User Story:** As a developer, I want to run the backend and frontend independently during development, so that changes to one do not require restarting the other.

#### Acceptance Criteria

1. THE API_Server SHALL start independently using a dedicated dev script (e.g., a "dev:server" npm script) without requiring the Frontend_App to be running, and SHALL listen on a configured port (default 3000)
2. WHILE in development mode, THE Frontend_App SHALL start independently using Vite dev server on a separate port (default 5173) and SHALL proxy all requests matching the `/api` path prefix to the API_Server's port
3. THE API_Server SHALL provide a production build script that compiles TypeScript to JavaScript and outputs the result to a `dist` directory
4. WHEN a TypeScript source file in the API_Server is saved during development, THE API_Server SHALL automatically restart and be ready to accept requests within 5 seconds of the file change
5. WHILE the Frontend_App is running in development mode, IF the API_Server is not running, THEN the Frontend_App SHALL still start successfully and serve the frontend application without crashing

### Requirement 8: Input Validation and Error Handling

**User Story:** As a developer, I want all API inputs to be validated and errors to be handled consistently, so that the API is robust and provides clear feedback.

#### Acceptance Criteria

1. THE API_Server SHALL validate request body schemas before processing any business logic and SHALL reject request bodies exceeding 1 MB in size
2. IF a request body fails schema validation, THEN THE API_Server SHALL return a 400 status code with a JSON response containing an `error` field with a general message and a `fields` array where each entry identifies the invalid field name and the reason for rejection
3. IF an unhandled error occurs during request processing, THEN THE API_Server SHALL return a 500 status code with a JSON response containing only an `error` field with a generic message indicating an internal failure, and SHALL log the error message, stack trace, and request metadata server-side
4. THE API_Server SHALL not expose internal error details, stack traces, or sensitive information in error responses to clients
5. IF a request body cannot be parsed as valid JSON, THEN THE API_Server SHALL return a 400 status code with a JSON response containing an `error` field indicating that the request body is malformed

### Requirement 9: Order Management Endpoint

**User Story:** As a store administrator, I want the backend to handle order persistence, so that order data is stored securely and consistently regardless of client behavior.

#### Acceptance Criteria

1. WHEN a payment is successfully verified, THE API_Server SHALL create an order record in Firestore containing the paymentId, cart items (each with productId, name, price, quantity, and imageUrl), shipping address (fullName, address, city, zipCode), customerEmail, totalAmount, userId, and a createdAt timestamp
2. WHEN an order creation request is received, THE API_Server SHALL validate that all required fields are present and that items contains at least 1 and at most 50 entries, totalAmount is greater than 0, customerEmail is a valid email format, and each shippingAddress sub-field (fullName, address, city, zipCode) is a non-empty string of no more than 200 characters
3. IF any required order field is missing or fails validation, THEN THE API_Server SHALL return a 400 status code with an error message indicating which fields are invalid, without persisting any data
4. IF order persistence to Firestore fails, THEN THE API_Server SHALL return a 500 status code with an error message indicating a server-side failure, and log the error type and timestamp for investigation
5. WHEN an order record is successfully created, THE API_Server SHALL set the order status field to "paid" and return the created order ID to the caller within 5 seconds of the request being received

### Requirement 10: Environment and Configuration Management

**User Story:** As a developer, I want environment-specific configuration to be cleanly managed, so that the API works correctly across development, staging, and production environments.

#### Acceptance Criteria

1. THE API_Server SHALL validate the following environment variables at startup before accepting any requests: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS` (a comma-separated list of origin URLs), and `PORT` (an integer between 1 and 65535, defaulting to 3000 if not set)
2. IF a required environment variable is missing at startup, THEN THE API_Server SHALL log an error message that includes the name of each missing variable, and exit with a non-zero status code within 5 seconds of startup initiation
3. THE API_Server SHALL provide a `.env.example` file listing all required environment variables (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS`, `PORT`) and all optional environment variables (`NODE_ENV`), each accompanied by a one-line comment stating its purpose and expected format
4. THE Frontend_App SHALL use `VITE_API_URL` to configure the API base URL and `VITE_RAZORPAY_KEY_ID` for the client-side Razorpay key
5. IF `VITE_API_URL` or `VITE_RAZORPAY_KEY_ID` is not set at build time, THEN THE Frontend_App SHALL fail the build with an error message identifying the missing variable
