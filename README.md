# POS System — Progress Check

Use this file as a snapshot of the implementation in the repository today. [`ARCHITECTURE.md`](./ARCHITECTURE.md) is the target architecture and reference for what the backend is intended to become; it is not a description of the current implementation.

## Current project shape

The repository currently contains a Node.js/Express backend using MongoDB and Mongoose. There is no frontend in the project tree. The running API currently mounts only product routes at `/api/products`.

## Progress against the target

| Capability | Progress | Current state |
| --- | --- | --- |
| Backend foundation | Done | Express app and server startup are separate; MongoDB connection is established before listening. Environment configuration is centralized. |
| Product management | Done | Product list, lookup, create, update, and soft archive endpoints are implemented. Product schema validates integer centavo prices and non-negative integer stock; barcode is unique. |
| Product API behavior | Done | Shared not-found and error middleware handle unknown routes and common Mongoose errors. Product tests are present. |
| Inventory movement data | Started | `InventoryMovement` schema captures product, movement type, quantity, before/after stock, and reason. It is not yet connected to application code. |
| Inventory transaction behavior | In progress | Tests in `backend/tests/inventory.test.js` explore MongoDB transaction commit and rollback using product updates directly. There is no production stock movement operation yet. |
| Low-stock configuration | Started | `LOW_STOCK_DEFAULT` has a default of 10 and is validated as a non-negative integer. No endpoint or report consumes it yet. |
| Sales and checkout | Not started | No sales model, route, or checkout flow is present. |
| Authentication and roles | Not started | No authentication or authorization implementation is present. |
| Dashboard and reporting | Not started | No reporting implementation is present. |
| Frontend | Not started | No frontend application is present in this repository. |

## Current API

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/products` | Returns all products, including archived products. |
| `GET` | `/api/products/:id` | Returns a product or an empty 404 response. |
| `POST` | `/api/products` | Creates a product and returns 201. |
| `PUT` | `/api/products/:id` | Updates name, barcode, and price; stock is kept separate. |
| `DELETE` | `/api/products/:id` | Sets `isActive` to false and returns 204. |

## Next implementation milestone

Build the inventory operation described in `ARCHITECTURE.md`: validate a stock movement, update the product stock, and persist the movement record in the same MongoDB transaction so either both writes succeed or neither does. Then expose it through an inventory route/controller and cover the HTTP behavior with tests.

## Verification notes

The backend test command is `npm test` from `backend/`; it uses the configured test database and runs test files serially. Tests were not run while preparing this progress snapshot. The inventory movement model test currently has contradictory validation assertions that should be corrected before relying on that test as a verification result.
