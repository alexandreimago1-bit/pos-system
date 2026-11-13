# Backend Architecture

## 1. Overview

The backend is the server-side application of a Retail POS & Inventory Management System designed to support product management, inventory tracking, and sales operations for small retail businesses.

It is built using **Node.js, Express, MongoDB, and Mongoose**. The backend exposes REST API endpoints, handles application requests, enforces data validation, and manages communication with the database.

## 2. Folder Map

### Config

`config/env.js` is the only file that reads environment variables. Every other file imports configuration values from it.

`config/db.js` exports `connectDB`, which returns the database connection promise and does nothing until called. `server.js` calls it, so the decision about what happens when the connection fails stays in one place.

**Why:** Reading `process.env` in many files makes it difficult to identify application requirements. Connecting to the database on import would also cause tests that load the application to attempt a database connection unnecessarily.

### Models

`models/Product.js` defines the Product schema and exports the Mongoose model. It owns the product's data structure, schema-level validation, and database model behavior.

The schema defines:

- Required product name and barcode.
- Non-negative integer price and stock values.
- Default stock of `0`.
- Default active status of `true`.
- Automatic creation and update timestamps.

The model also transforms documents when converted to JSON, exposing `id` instead of `_id` and removing the internal `__v` property.

It does not handle HTTP requests, send responses, or decide how API errors are presented to clients.

**Why:** The model should define what valid product data looks like, independently of how the application receives that data.

### Routes

`routes/productRoutes.js` defines the product API endpoints and connects each route to its corresponding controller function.

It does not contain database operations, request-processing logic, or business rules.

**Why:** Routes should define how requests enter the application, not what the application does with them.

### Controllers

`controllers/productController.js` contains the handlers for product-related HTTP requests. Controllers receive request data, coordinate the necessary operations, and send HTTP responses.

They use the Product model to retrieve, create, update, and archive product documents.

The controllers do not define database schemas or own complex business rules.

**Why:** Separating request handling from data modeling keeps controllers focused on HTTP concerns and makes application behavior easier to maintain.

### Middleware

`middleware/notFound.js` handles requests that do not match any registered route.

`middleware/errorHandler.js` centralizes error handling and converts forwarded errors into standardized HTTP responses.

The error handler currently handles:

- Mongoose `CastError` — HTTP 400.
- Mongoose `ValidationError` — HTTP 400.
- Duplicate key error — HTTP 409.
- Unexpected errors — HTTP 500.

Neither middleware is responsible for implementing product-specific operations.

**Why:** Shared request and error-handling behavior should be defined once rather than repeated across individual routes and controllers.

### Requests

`requests/` contains `.rest` files used to manually send HTTP requests to the backend during development.

These files are for API verification and do not form part of the application's runtime logic.

**Why:** Keeping reusable request examples in the repository makes endpoint behavior easier to inspect and manually verify.

### Application Entry — `app.js`

`app.js` creates the Express application, registers middleware, mounts routers, and exports the configured application.

The middleware is registered in the following order:

1. `express.json()` parses incoming JSON request bodies.
2. Product routes handle registered product endpoints.
3. `unknownEndpoint` handles unmatched requests.
4. `errorHandler` handles errors forwarded through Express.

It does not establish the database connection or start the HTTP server.

**Why:** The application can be imported independently of server startup, making its configuration easier to test and reuse.

### Server Entry — `server.js`

`server.js` imports the configured application, calls `connectDB()`, and starts the HTTP server after a successful database connection.

If the database connection fails, the server does not start listening for incoming requests.

It owns application startup, but does not define routes, controllers, or application middleware.

**Why:** Keeping startup responsibilities separate from application configuration gives the project a clear initialization flow and keeps database connection failure handling in one place.

## 3. Request Lifecycle

The backend separates application configuration from server startup.

- `server.js` establishes the database connection and starts the HTTP server.
- `app.js` creates and configures the Express application.
- Incoming requests pass through registered middleware before reaching their matching routes.
- Controllers coordinate model operations and send HTTP responses.

### Example: Creating a Product

**Request:** `POST /api/products`

```text
HTTP Request
     |
     v
Express Application (app.js)
     |
     v
express.json()
     |
     v
Product Router
     |
     v
Product Controller
     |
     v
Mongoose Product Model
     |
     v
Schema Validation
     |
     v
MongoDB Atlas
     |
     v
HTTP Response
```

1. The frontend sends an HTTP POST request containing product information as JSON.
2. Express receives the request.
3. `express.json()` parses the JSON request body and makes the data available through `req.body`.
4. The product router matches the HTTP method and endpoint.
5. The corresponding controller handles the request.
6. The controller creates a Mongoose Product document in memory.
7. The controller calls `.save()`, triggering Mongoose validation and attempting to persist the document.
8. MongoDB Atlas stores the product if the operation succeeds.
9. The controller sends a `201 Created` response containing the saved product as JSON.

The Product model's JSON transformation ensures that the API response exposes `id` instead of MongoDB's internal `_id` and excludes `__v`.

### Error Flow

```text
Request Processing
       |
       v
An error occurs
       |
       v
Express Error Handling
       |
       v
errorHandler.js
       |
       v
Appropriate HTTP Error Response
```

Express 5 automatically forwards rejected promises from asynchronous route handlers and controllers to the error-handling middleware.

Errors from other middleware can also be forwarded through Express's error-handling mechanism.

The centralized error handler determines the appropriate HTTP status and response based on the error.

Unknown endpoints follow a separate path through `notFound.js`, which returns a `404 Not Found` response.

## 4. Testing Strategy

The backend uses Node.js's built-in test runner, `node:test`, alongside Supertest for HTTP integration testing.

The integration tests exercise the API through HTTP requests and verify the behavior of the controllers, models, middleware, and database interactions.

### Test Database

A separate MongoDB test database is used to prevent integration tests from modifying development data.

The test setup:

- Establishes a database connection before testing.
- Verifies that the active database is the test database.
- Clears and reseeds the Product collection before each test.
- Closes the database connection after the test suite finishes.

### Product API Test Coverage

The integration suite currently contains 22 passing tests covering:

- Retrieving all products.
- Retrieving a product by ID.
- Handling missing and malformed IDs.
- Creating products successfully.
- Handling missing fields and empty request bodies.
- Rejecting negative and decimal price values.
- Rejecting invalid stock values.
- Handling duplicate barcodes.
- Updating product information.
- Preventing stock changes through the product update endpoint.
- Handling missing products during updates.
- Archiving products instead of physically deleting them.
- Verifying archive idempotency.

**Current result:** 22 passing tests, 0 failing tests.

**Why:** Integration testing verifies that the different backend components work together and that API behavior remains consistent when changes are introduced.

## 5. Decisions and Trade-offs

### Separate `app.js` and `server.js`

**Decision:** Application configuration and server startup are handled separately.

**Reason:** This keeps the Express application independent of the process that starts the HTTP server. It also makes the application easier to import and test independently.

**Trade-off:** Introduces an additional file and import relationship, but provides clearer separation of responsibilities.

### Store prices in integer centavos

**Decision:** Product prices are stored as integers in centavos rather than decimal peso values.

**Reason:** Avoids common floating-point precision problems when handling monetary values.

**Trade-off:** Values must be converted between centavos and pesos when displaying prices or accepting user-facing monetary input.

### Use soft deletion for products

**Decision:** Products are archived by setting `isActive` to `false` instead of physically deleting their database records.

**Reason:** Preserves historical product information for future inventory and sales records.

**Trade-off:** Queries and future application features must account for archived products.

### Keep stock updates separate from product updates

**Decision:** The product update endpoint (`PUT /api/products/:id`) does not modify stock.

**Reason:** Product information and inventory movements represent different responsibilities. Stock changes should be handled through dedicated inventory operations.

**Trade-off:** Requires a separate inventory workflow and endpoint implementation.

## 6. Not Built Yet

The following capabilities are part of the planned MVP but have not yet been implemented.

| Feature                  | Status          |
| ------------------------ | --------------- |
| Product management API   | Implemented     |
| Inventory management     | Not implemented |
| Sales and checkout       | Not implemented |
| User authentication      | Not implemented |
| Role-based authorization | Not implemented |
| Dashboard and reporting  | Not implemented |

These are intentional development gaps, not existing backend capabilities.

The current backend primarily establishes the foundation for product management. Future features should follow the existing architectural separation and preserve the documented data and business rules.
