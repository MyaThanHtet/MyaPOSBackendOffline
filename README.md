# MyaPOS Backend

Node.js REST API for a POS system using Express and SQLite.

## Quick start

1. Create `.env` from `.env.example` and update values.
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run dev`

## Windows one-click setup

Use this if users should run the server without opening an IDE/project.

1. Copy this backend folder to the Windows laptop.
2. Install Node.js 18+ once.
3. Double-click `windows\install.bat` (first-time setup).
4. Edit `.env` and set `JWT_SECRET`.
5. Optional: set `FRONTEND_BUILD_DIR` in `.env` to your frontend `build/web` folder.
6. Double-click one of these:
   - `windows\start-server.bat` (backend only)
   - `windows\start-pos.bat` (start backend and open browser at `http://localhost:3000`)

Notes:
- If `FRONTEND_BUILD_DIR` points to a valid `build/web` folder, backend will serve it at `/`.
- Keep API base URL as `http://localhost:3000/api`.
- For desktop convenience, create a shortcut to `windows\start-pos.bat`.

## Structure

- `src/models`: table descriptors
- `src/controllers`: Request handling
- `src/services`: Business logic
- `src/routes`: API routes
- `src/middleware`: Auth, error handling, logging
- `src/config`: SQLite connection and environment variables
- `src/repositories`: Data access layer

## Auth

All endpoints are JWT-protected unless noted in `AGENT.md`. Tokens must include:

- `uid`: user identifier
- `role`: `user`, `admin`, or `super_admin`

Admin routes enforce `role`.

## Base path

- `/api` (main API)
- `/db` and `/api/db` (SQLite REST adapter)

## OpenAPI

- `openapi.yaml`
- Swagger UI: `GET /docs`

## Endpoints (AGENT.md)

Auth:
- `POST /api/auth/signup`
- `POST /api/auth/login` (auto-creates if user not found)

Bulk Sync:
- `GET /api/sync/bootstrap`
- `POST /api/sync/pull`
- `POST /api/sync/push`
- `POST /api/sync/pull-single`

Users & Subscriptions:
- `GET /api/users/me`
- `PUT /api/users/me`
- `GET /api/users/:uid/subscription`
- `PUT /api/admin/users/:uid/subscription`

Admin:
- `GET /api/admin/payment-settings`
- `PUT /api/admin/payment-settings`
- `GET /api/admin/users?ownerEmail=...`
- `PUT /api/admin/users/:uid`

Menu & Categories:
- `GET /api/menu-items`
- `PUT /api/menu-items/:id`
- `DELETE /api/menu-items/:id`
- `GET /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`

Tables & Zones:
- `GET /api/tables`
- `PUT /api/tables/:id`
- `DELETE /api/tables/:id`
- `GET /api/table-zones`
- `PUT /api/table-zones/:id`
- `DELETE /api/table-zones/:id`
- `POST /api/tables/move`

Orders & Invoices:
- `GET /api/bills`
- `PUT /api/bills/:id`
- `DELETE /api/bills/:id`
- `GET /api/bill-items`
- `PUT /api/bill-items/:id`
- `DELETE /api/bill-items/:id`
- `GET /api/invoice-voids`
- `PUT /api/invoice-voids/:id`
- `DELETE /api/invoice-voids/:id`

Payments:
- `GET /api/payments`
- `PUT /api/payments/:id`
- `DELETE /api/payments/:id`
- `GET /api/payment-methods`
- `PUT /api/payment-methods/:id`
- `DELETE /api/payment-methods/:id`

Inventory:
- `GET /api/inventory-items`
- `PUT /api/inventory-items/:id`
- `DELETE /api/inventory-items/:id`
- `GET /api/recipe-items`
- `PUT /api/recipe-items/:id`
- `DELETE /api/recipe-items/:id`
- `GET /api/inventory-waste`
- `PUT /api/inventory-waste/:id`
- `DELETE /api/inventory-waste/:id`
- `GET /api/inventory-deductions`
- `PUT /api/inventory-deductions/:bill_id`
- `DELETE /api/inventory-deductions/:bill_id`

Pricing & Discounts:
- `GET /api/pricing-settings`
- `PUT /api/pricing-settings/:id`
- `GET /api/discount-rules`
- `PUT /api/discount-rules/:id`
- `DELETE /api/discount-rules/:id`
- `GET /api/business-rules`
- `PUT /api/business-rules/:id`

Delivery Platforms:
- `GET /api/delivery-platforms`
- `PUT /api/delivery-platforms/:id`
- `DELETE /api/delivery-platforms/:id`

Store & Hardware Settings:
- `GET /api/receipt-config`
- `PUT /api/receipt-config/:id`
- `GET /api/printer-settings`
- `PUT /api/printer-settings/:id`
- `GET /api/store-profile`
- `PUT /api/store-profile/:id`
- `GET /api/sync-settings`
- `PUT /api/sync-settings/:id`

Staff:
- `GET /api/staff-users`
- `PUT /api/staff-users/:id`
- `DELETE /api/staff-users/:id`

## Health check

- `GET /api/health`
