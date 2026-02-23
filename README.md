# MyaPOS Backend

Node.js REST API for a POS system using Express and SQLite.

## Quick start

1. Create `.env` from `.env.example` and update values.
2. Install dependencies: `npm install`
3. Run in dev mode: `npm run dev`

## Portable Windows installation guide (Backend + Frontend public folder)

Use this when you want to run from a copied folder or USB without installing Node.js globally.

### 1. Prepare folder structure

Project root should include:

- `node-bin\` (from Node.js Windows ZIP, including `node.exe` and `npm.cmd`)
- `windows\start-pos.bat`
- `windows\run-silent.vbs`
- `src\` (backend source)
- `public\` (frontend web build files)

Example:

```text
MyaPOSBackendOffline/
  node-bin/
    node.exe
    npm.cmd
    ...
  public/
    index.html
    manifest.json
    flutter_service_worker.js (if Flutter web)
    assets/
  windows/
    start-pos.bat
    run-silent.vbs
  src/
  package.json
  .env
```

### 2. Put frontend build into `public`

Copy your frontend production build files into `public\`.

- If your build output is `build\web\*`, copy all contents of that folder into `public\`.
- Ensure `public\index.html` exists.

### 3. Configure environment

Create `.env` from `.env.example` (if needed), then set:

- `JWT_SECRET=your_secret_here`
- `PORT=3000` (or your preferred port)
- `FRONTEND_BUILD_DIR=./public`

`FRONTEND_BUILD_DIR=./public` makes the backend serve your frontend at `http://localhost:3000/`.

### 4. First run (installs dependencies using local node-bin)

Run:

- `windows\start-pos.bat`

What it does:

- Uses `.\node-bin\node.exe` and `.\node-bin\npm.cmd`
- Installs dependencies if `node_modules` is missing or incompatible
- Starts backend server only (does not open browser)

### 5. Run backend silently (no visible terminal)

Run:

- `windows\run-silent.vbs`

This launches `start-pos.bat` hidden in the background.

### 6. Auto-start backend when Windows boots

1. Press `Win + R`
2. Type `shell:startup`
3. Press Enter
4. In the opened Startup folder, create a shortcut to:
   - `...\MyaPOSBackendOffline\windows\run-silent.vbs`
5. Restart Windows and verify backend is running.

### 7. Verify server

- API health: `http://localhost:3000/api/health`
- Frontend: `http://localhost:3000/`

Keep frontend API base URL as `http://localhost:3000/api`.

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
