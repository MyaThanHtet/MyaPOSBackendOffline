# Required API Endpoints For This Project

## Base URL
- `ApiClient` routes are resolved under: `http://localhost:3000/api`
- Database adapter routes are attempted in this order:
1. `http://localhost:3000/db/...`
2. fallback `http://localhost:3000/api/db/...` (if first returns `404`)

## Auth
- `POST /auth/login`
- `POST /auth/signup`

Required request body (login/signup):
- `email` (string)
- `password` (string)

Expected auth response fields:
- `uid` (string)
- `token` (string)
- `email` (string)
- `role` (string)
- `ownerId` or `owner_id` (string, optional)

## User / Subscription
- `GET /users/me`
- `PUT /users/me`
- `GET /users/{uid}/subscription`
- `DELETE /users/clear-data`

`PUT /users/me` body fields used by app:
- `uid` (string)
- `email` (string)
- `emailLower` (string)
- `updatedAt` (int)

## Staff
- `POST /staff-users`

`POST /staff-users` body fields used by app:
- `email` (string)
- `password` (string)
- `role` (string, optional)

Response must include `uid` either at top-level or under `user.uid` or `data.uid`.

## Admin
- `GET /admin/payment-settings`
- `PUT /admin/payment-settings`
- `GET /admin/users?page={n}&limit={n}`
- `GET /admin/users/search?page={n}&limit={n}&query={text}`
- `PUT /admin/users/{uid}`
- `PUT /admin/users/{uid}/subscription`
- `DELETE /admin/clear-data`

`GET /admin/users*` response should include list in one of:
- `items`
- `data`
- `users`
- `results`
- `rows`

And pagination fields are expected/used if present:
- `page`, `limit`, `total`, `totalPages`

## Sync
- `POST /sync/push`
- `POST /sync/pull`
- `GET /sync/bootstrap?ownerId={ownerId}`

`POST /sync/push` body shape:
- `ownerId` (string)
- `entries` (array of objects)

Each entry uses:
- `id`
- `entity`
- `entity_id`
- `type` (`upsert` or `delete`)
- `payload` (object)
- `created_at` (int)

`POST /sync/pull` body shape:
- `ownerId` (string)
- `since` (map of table -> int)
- `include_deleted` (bool)

Expected sync response fields:
- for push: `applied` (list), `rejected` (list)
- for pull/bootstrap: `changes` (map of table -> list of rows)

## Table Operation
- `POST /tables/move`

Body fields:
- `bill` (object)
- `source_table` (object)
- `target_table` (object)

## Database REST Adapter (Replaces SQLite)
The app now calls a generic DB REST layer through `AppDatabase`.

### CRUD Endpoints
- `GET /db/{table}`
- `POST /db/{table}`
- `PUT /db/{table}`
- `DELETE /db/{table}`

### Optional raw endpoints used by app utilities
- `POST /db/raw-query`
- `POST /db/raw-update`
- `POST /db/raw-delete`
- `POST /db/execute`

### GET /db/{table} query params used
- `distinct` (bool string)
- `columns` (comma-separated)
- `where` (SQL-like expression with `?` placeholders)
- `whereArgs` (JSON-encoded array string)
- `groupBy`
- `having`
- `orderBy`
- `limit`
- `offset`

### POST /db/{table} body used
- `values` (object)
- `nullColumnHack` (string, optional)
- `conflictAlgorithm` (`replace`, etc., optional)

### PUT /db/{table} body used
- `values` (object)
- `where` (string, optional)
- `whereArgs` (array, optional)
- `conflictAlgorithm` (string, optional)

### DELETE /db/{table} body used
- `where` (string, optional)
- `whereArgs` (array, optional)

### Raw endpoints body used
- `sql` (string)
- `arguments` (array, optional)

### Response expectations for DB adapter
- Query endpoints should return either:
1. a JSON array of row objects, or
2. an object containing one of `rows`, `items`, or `data` as an array
- Write endpoints should return either:
1. number, or
2. object containing one of `changes`, `affectedRows`, `count`, or `id`

## Required Tables In /db/{table}
- `menu_items`
- `tables`
- `table_zones`
- `inventory_items`
- `bills`
- `payments`
- `categories`
- `delivery_platforms`
- `bill_items`
- `recipe_items`
- `inventory_waste`
- `pricing_settings`
- `discount_rules`
- `payment_methods`
- `invoice_voids`
- `inventory_deductions`
- `business_rules`
- `receipt_config`
- `printer_settings`
- `store_profile`
- `staff_users`
- `sync_settings`
- `expenses`
- `outbox`
