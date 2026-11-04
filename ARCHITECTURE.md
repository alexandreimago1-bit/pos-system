# Backend Architecture

## 1. Overview

The backend is the server-side application of a Retail POS & Inventory Management System designed to support product management, inventory tracking, and sales operations for small retail businesses. It is built using **Node.js, Express, and MongoDB with Mongoose**. The backend exposes REST API endpoints, handles application requests, enforces data validation, and manages communication with the database.

## 2. Folder Map

### Config

`config/env.js` is the only file that reads environment variables. Every other file imports configuration values from it.

`config/db.js` exports `connectDB`, which returns the database connection promise and does nothing until called. `server.js` calls it, so the decision about what happens when the connection fails stays in one place.

**Why:** Reading `process.env` in many files makes it difficult to identify application requirements. Connecting to the database on import would also cause tests that load the application to attempt a database connection unnecessarily.

### Models

`models/Product.js` defines the Product schema and exports the Mongoose model. It owns the product's data structure, schema-level validation, and database model behavior.

It does not handle HTTP requests, send responses, or decide how API errors are presented to clients.

**Why:** The model should define what valid product data looks like, independently of how the application receives that data.

### Routes

`routes/productRoutes.js` defines the product API endpoints and connects each route to its corresponding controller function.

It does not contain database operations, request-processing logic, or business rules.

**Why:** Routes should define how requests enter the application, not what the application does with them.

### Controllers

`controllers/productController.js` contains the handlers for product-related HTTP requests. Controllers receive request data, coordinate the necessary operations, and send HTTP responses.

They do not define database schemas or own complex business rules. Errors are passed to the centralized error handler using `next(error)`.

**Why:** Separating request handling from business logic keeps controllers focused on HTTP concerns and makes application behavior easier to maintain.

### Middleware

`middleware/notFound.js` handles requests that do not match any registered route.

`middleware/errorHandler.js` centralizes error handling and converts forwarded errors into standardized HTTP responses.

Neither middleware is responsible for implementing product-specific operations.

**Why:** Shared request and error-handling behavior should be defined once rather than repeated across individual routes and controllers.

### Requests

`requests/` contains `.rest` files used to manually send HTTP requests to the backend during development.

These files are for API verification and do not form part of the application's runtime logic.

**Why:** Keeping reusable request examples in the repository makes endpoint behavior easier to inspect and manually verify.

### Application Entry — `app.js`

`app.js` creates the Express application, registers middleware, mounts routers, and exports the configured application.

It does not establish the database connection or start the HTTP server.

**Why:** The application can be imported independently of server startup, making its configuration easier to test and reuse.

### Server Entry — `server.js`

`server.js` imports the configured application, calls `connectDB()`, and starts the HTTP server after a successful database connection.

It owns application startup, but does not define routes, controllers, or application middleware.

**Why:** Keeping startup responsibilities separate from application configuration gives the project a clear initialization flow and keeps database connection failure handling in one place.

## 3. Request Lifecycle

The backend separates application configuration from server startup.

- `server.js` establishes the database connection and starts the HTTP server.
- `app.js` creates and configures the Express application.
- Incoming requests are processed by registered middleware before reaching their respective routes.

### Example: Creating a Product

**Request:** `POST /api/products`

```text
HTTP Request
     |
     v
app.js
     |
     v
express.json()
     |
     v
productRoutes.js
     |
     v
productController.js
     |
     v
Product.js (Mongoose Model)
     |
     v
MongoDB
     |
     v
HTTP Response
```

1. Express receives the incoming HTTP request.
2. JSON middleware parses the request body.
3. The product router matches the endpoint and HTTP method.
4. The corresponding controller handles the request.
5. The controller uses the Product model to create the database record.
6. Mongoose validates the data before persistence.
7. The controller sends the appropriate HTTP response.

### Error Flow

```text
Request Processing
       |
       v
An error occurs
       |
       v
next(error)
       |
       v
errorHandler.js
       |
       v
Standardized HTTP Error Response
```

Errors passed to `next(error)` are forwarded to the centralized error-handling middleware. Unknown endpoints are handled separately by `notFound.js`.

## 6. Decisions and Trade-offs

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

## 8. Not Built Yet

The following capabilities are part of the planned MVP but have not yet been implemented.

| Feature                  | Status          |
| ------------------------ | --------------- |
| Product management API   | Implemented     |
| Inventory management     | Not implemented |
| Sales and checkout       | Not implemented |
| User authentication      | Not implemented |
| Role-based authorization | Not implemented |
| Dashboard and reporting  | Not implemented |
| Automated test suite     | Not implemented |

These are intentional development gaps, not existing backend capabilities.

The current backend primarily establishes the foundation for product management. Future features should follow the existing architectural separation and preserve the documented data and business rules.
