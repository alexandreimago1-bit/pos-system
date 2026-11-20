# AGENTS.md — Project Instructions

## Project Goal

Build a reliable Retail POS & Inventory Management System for small retail businesses.

The backend must prioritize:

- Data integrity
- Accurate inventory records
- Traceable stock changes
- Safe concurrent operations
- Maintainable architecture
- Automated testing

Do not prioritize adding features over correctness and understanding.

## Before Making Changes

1. Read this file.
2. Inspect `README.md` to understand the actual implementation status.
3. Inspect `ARCHITECTURE.md` to understand the intended architecture and design decisions.
4. Inspect relevant source files and tests before modifying them.
5. Do not assume documentation is more current than the actual code.

## Architecture Conventions

- Use CommonJS.
- Keep environment-variable access centralized in `config/env.js`.
- Keep database connection logic in `config/db.js`.
- Keep Express application setup in `app.js`.
- Keep server startup in `server.js`.
- Routes define endpoints and connect them to controllers.
- Controllers handle HTTP requests and responses.
- Services own reusable business operations and workflows.
- Models define data structures and enforce schema-level integrity.
- Middleware handles shared request and error behavior.
- Tests should verify observable behavior.

Avoid unnecessary abstractions and premature architecture.

## Implementation Principles

- Keep product information updates separate from inventory operations.
- Never modify stock through the product update endpoint.
- Do not physically delete products; use archive behavior.
- Inventory movements must be traceable and immutable through the API.
- Stock updates and their corresponding movement records must be atomic.
- Use transactions when multiple database writes must succeed or fail together.
- Do not assume transactions alone solve concurrency.
- Use atomic conditional database updates for stock-sensitive operations.
- Preserve existing API behavior unless a deliberate change is required.

## Inventory Business Rules

- Archived products cannot be restocked.
- Archived products can receive damage and physical adjustments.
- Restock uses a positive `quantity`.
- Damage uses a negative `quantity`.
- Adjustment uses `countedStock` as input and stores the calculated signed `quantity`.
- Movement records must satisfy:

  `stockAfter = stockBefore + quantity`

- Movement quantity must be a nonzero integer.
- Low-stock default threshold is 10.
- Zero-difference adjustment must not create a movement.
- Movement history is returned newest first.

## Error Handling

- HTTP 400: invalid input.
- HTTP 404: missing resource.
- HTTP 409: state conflict.
- HTTP 500: unexpected server error.

Express 5 automatically forwards rejected promises from async route handlers. Avoid redundant error-forwarding boilerplate.

## Testing Requirements

- Use `node:test` and Supertest.
- Use the dedicated test database.
- Verify the active database is `pos_test` before running database tests.
- Never run destructive tests against the development database.
- Reset relevant collections between integration tests.
- Test successful behavior, invalid input, missing resources, and state conflicts.
- Verify rejected operations leave database state unchanged.
- Test transaction rollback and commit behavior.
- Test concurrent stock operations.
- Run the full test suite and lint before declaring a milestone complete.

A passing test must prove the intended behavior. Avoid tests that pass by swallowing unexpected errors or asserting only implementation details.

## Development Workflow

Follow:

**Build → Test → Understand → Refactor → Trace**

For each milestone:

1. Establish the business requirement.
2. Define expected behavior.
3. Identify relevant models, routes, controllers, services, and middleware.
4. Implement one focused behavior at a time.
5. Test success and failure cases.
6. Understand the request lifecycle and database effects.
7. Refactor only after behavior is verified.
8. Document meaningful decisions and limitations.

## Documentation Rules

- `README.md` describes the current implementation and progress.
- `ARCHITECTURE.md` describes the intended architecture, decisions, and system behavior.
- `AGENTS.md` contains persistent instructions for coding agents.

Keep these documents consistent without claiming planned functionality is implemented.

Update documentation when a milestone is verified, not merely when code is drafted.

## Scope Control

Do not introduce unrelated features, libraries, infrastructure, or architectural complexity without a clear requirement.

Do not prematurely implement sales, checkout, authentication, roles, dashboards, or frontend features while the current inventory milestone is unfinished.

Follow the established Phase 4 checklist and build order.

## Collaboration Expectations

When assisting the project owner:

- Explain unfamiliar concepts and APIs before asking for implementation.
- Prefer guided implementation over unsolicited full-code replacements.
- Review existing code before proposing changes.
- Distinguish actual defects from optional style improvements.
- Explain the business and technical reasons behind recommendations.
- Preserve the project's existing conventions.
- Do not mark tasks complete without verification.

<!-- PROJECT OVERVIEW THIS IS THE GOAL -->

# POS System — Continuation Handoff

We're continuing my MERN Retail POS & Inventory Management System.

## 1. My learning preferences

- Teach me collaboratively. Don't provide complete implementations unless I ask.
- Let me implement the code myself.
- When introducing unfamiliar concepts or APIs, show a viable example and explain it before asking me to implement.
- For familiar concepts, let me work through the implementation.
- Follow: **Build → Test → Understand → Refactor → Trace**.
- Explain each milestone through:
  1. What we're building.
  2. The business rules.
  3. The technical design.
  4. Implementation.
  5. Testing and verification.
  6. Understanding and tracing.
- Review my actual code. Distinguish bugs, necessary improvements, and stylistic preferences.
- Don't restart completed work or introduce unnecessary complexity.
- I prefer understanding why something works instead of memorizing syntax.

## 2. Project overview

A Retail POS & Inventory Management System designed for small retail businesses.

**Stack:**

- Node.js
- Express 5
- MongoDB Atlas
- Mongoose
- CommonJS
- Node.js built-in test runner
- Supertest

The repository currently contains the backend. There is no frontend implementation yet.

## 3. Current project architecture

```text
backend/
├── config/
│   ├── db.js
│   └── env.js
├── models/
│   ├── Product.js
│   └── InventoryMovement.js
├── routes/
├── controllers/
├── services/
├── middleware/
├── tests/
├── requests/
├── app.js
└── server.js
```

The project separates:

- Configuration
- Database connection
- Models
- Routes
- Controllers
- Services
- Middleware
- Application setup
- Server startup
- Tests

`app.js` configures and exports the Express application. `server.js` connects to MongoDB before starting the server.

`config/env.js` is the only file that reads environment variables.

## 4. Documentation responsibilities

There are three important project documents:

### README.md

A progress checker describing what is actually implemented in the repository today.

It must not describe planned features as completed.

### ARCHITECTURE.md

Documents the intended architecture, design decisions, request lifecycles, testing strategy, and trade-offs.

Update it as the architecture evolves. Keep it accurate and distinguish implemented behavior from planned design.

### AGENTS.md

Provides persistent instructions to coding agents working on this repository.

It should communicate:

- Project purpose and goals.
- Current architecture and conventions.
- Business rules and technical constraints.
- Development workflow.
- Testing requirements.
- Phase checklist and current milestone.
- Documentation responsibilities.

Before making changes, inspect the existing `AGENTS.md`, `README.md`, and `ARCHITECTURE.md`. Preserve useful existing instructions rather than replacing them unnecessarily.

When a milestone is completed, update the relevant documentation to reflect verified implementation status.

## 5. Phase 3 — Product Management

**Completed.**

- Product schema and CRUD endpoints.
- Centralized error handling.
- Archive-only deletion.
- Separate MongoDB test database.
- `app.js` and `server.js` separation.
- 22 passing integration tests.

Product endpoints:

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PUT /api/products/:id`
- `DELETE /api/products/:id`

Product stock is intentionally kept separate from product information updates.

## 6. Phase 4 — Inventory Management

**Current phase.**

Goal: Every stock change must be recorded, explainable, and safe under simultaneous requests.

### Locked business decisions

- Archived products: block restock, allow damage and adjustment.
- Opening stock: document opening balance; automatic opening movement is optional.
- Low-stock default: 10.
- Restock and damage use `quantity`.
- Physical adjustment uses `countedStock`.
- Stored movements do not contain `countedStock`.
- Movement arithmetic: `stockAfter = stockBefore + quantity`.
- Quantity must be nonzero.
- Restock quantity is positive.
- Damage quantity is negative.
- Adjustment quantity can be positive or negative.
- Zero-difference adjustment returns HTTP 200 without changing anything.
- Movement history is newest first.
- Errors: 400 bad input, 404 missing product, 409 state conflict.

### Current build order

4.0 → 4.1 → 4.2 → 4.3 → 4.5 → 4.6 → 4.4 → 4.7 → 4.8.

### 4.0 — Transaction verification

I added `LOW_STOCK_DEFAULT = 10` to `config/env.js`.

In `backend/tests/inventory.test.js`, I implemented two tests:

1. `an aborted transaction rolls back its writes`
2. `a committed transaction keeps its writes`

Both use Mongoose sessions and transactions and update Product stock by +5.

**Remaining work:**

Rollback test:

- Read the initial stock.
- Start a session and transaction.
- Update stock using the session.
- Verify the updated stock from inside the transaction.
- Simulate a movement creation failure.
- Capture and assert the expected error.
- Abort the transaction.
- End the session.
- Verify the original stock remains unchanged outside the transaction.
- Ensure unexpected errors aren't swallowed.

Commit test:

- Keep the stock update and commit.
- Abort and rethrow unexpected errors.
- Always end the session.
- Verify the committed stock increase persists.

We are currently revisiting this milestone. Do not assume it is complete until the acceptance criteria pass.

### 4.1 — InventoryMovement model

I created `backend/models/InventoryMovement.js` with:

- `product`
- `type`
- `quantity`
- `stockBefore`
- `stockAfter`
- `reason`

I also created `backend/tests/inventoryMovement.test.js`.

Initial test assertions need correction.

**Remaining work:**

- Require all necessary fields.
- Restrict movement types to `restock`, `damage`, and `adjustment`.
- Enforce nonzero integer quantity.
- Enforce valid stock values.
- Enforce `stockAfter = stockBefore + quantity`.
- Enforce movement sign rules.
- Test valid and invalid documents.

### 4.2 — Restock

- Implement restock endpoint.
- Validate quantity and reason.
- Block archived products.
- Update Product and create InventoryMovement in one transaction.
- Return movement with HTTP 201.
- Test rollback through the actual restock operation.
- Refactor business logic into `inventoryService`.

### 4.3 — Damage

- Implement damage endpoint.
- Reduce stock and record negative quantity.
- Reject insufficient stock with 409.
- Allow damage to archived products.
- Implement atomic stock check-and-subtract.
- Test concurrent damage requests.

### 4.5 — Movement history

- GET `/api/inventory/movements`.
- Return newest first.
- Filter by `productId`.
- Reject malformed IDs.
- Return an empty array when no movements exist.
- Keep movement records immutable through the API.

### 4.6 — Low-stock monitoring

- Return active products at or below threshold.
- Default threshold to 10.
- Support threshold query parameter.
- Sort lowest stock first.
- Exclude archived products.
- Test invalid thresholds and threshold zero.

### 4.4 — Physical adjustment

- Accept `countedStock`.
- Calculate signed quantity difference.
- Set product stock to physical count.
- Allow adjustments on archived products.
- Return 200 without creating a movement when difference is zero.
- Test invalid inputs and consistency.

### 4.7 — Consistency and regression

- Verify movement history forms a consistent stock chain.
- Verify product stock matches latest movement.
- Verify rejected requests do not change stock or movement count.
- Run all Phase 3 and Phase 4 tests.
- Run lint.

### 4.8 — Optional opening movement and documentation

- Add automatic opening movement when creating products with stock.
- Add `opening` movement type.
- Verify stock equals sum of movement quantities.
- Update README.md, ARCHITECTURE.md, and AGENTS.md.

## 7. Technical constraints

- Express 5 automatically forwards rejected async route-handler promises to error middleware.
- Avoid unnecessary `try/catch` in Express controllers.
- Use explicit error handling when a transaction must be aborted or an error transformed.
- Transactions provide atomicity, but do not independently solve concurrency problems.
- Use atomic conditional stock updates to prevent race conditions.
- Keep services independent of HTTP request/response objects.
- Controllers should handle HTTP concerns.
- Models should enforce data integrity.
- Do not introduce new libraries or infrastructure without a clear reason.

## 8. Immediate next task

Resume with **Phase 4.0 transaction verification**.

Inspect my current `backend/tests/inventory.test.js` and review the implementation before suggesting changes.

Do not restart the project, rewrite completed code, or jump to Phase 4.2.

The next goal is to finish transaction verification and then complete the remaining Phase 4.1 model validation rules.
