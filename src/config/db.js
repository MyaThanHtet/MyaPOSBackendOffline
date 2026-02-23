const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const { sqlitePath } = require('./env');

const BOOLEAN_COLUMNS = new Set([
  'is_deleted',
  'is_synced',
  'isDeleted',
  'is_active',
  'is_auto_sync_enabled',
  'show_tax',
  'show_discount',
  'show_cashier',
  'auto_reconnect',
  'currency_use_grouping',
  'isPremium',
  'isSuperAdmin',
  'auto_deduct_enabled',
  'low_stock_alerts_enabled',
  'waste_management_enabled',
  'table_service_charge_enabled'
]);

const JSON_COLUMNS = new Set(['permissions']);

const DB_ADAPTER_TABLES = [
  'menu_items',
  'tables',
  'table_zones',
  'inventory_items',
  'bills',
  'payments',
  'categories',
  'delivery_platforms',
  'bill_items',
  'recipe_items',
  'inventory_waste',
  'pricing_settings',
  'discount_rules',
  'payment_methods',
  'invoice_voids',
  'inventory_deductions',
  'business_rules',
  'receipt_config',
  'printer_settings',
  'store_profile',
  'staff_users',
  'sync_settings',
  'expenses',
  'outbox'
];

const INTERNAL_TABLES = ['auth_users', 'user_profiles', 'subscriptions', 'payment_settings'];
const MANAGED_TABLES = [...DB_ADAPTER_TABLES, ...INTERNAL_TABLES];
const ALLOWED_TABLES = new Set(MANAGED_TABLES);

let dbInstance;
const tableColumnCache = new Map();

const assertSafeIdentifier = (name) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(name))) {
    throw new Error(`Unsafe SQL identifier: ${name}`);
  }
};

const quoteIdentifier = (name) => {
  assertSafeIdentifier(name);
  return `"${name}"`;
};

const normalizeRow = (row) => {
  if (!row || typeof row !== 'object') {
    return row;
  }

  const normalized = { ...row };
  Object.keys(normalized).forEach((key) => {
    const value = normalized[key];
    if (BOOLEAN_COLUMNS.has(key) && (value === 0 || value === 1)) {
      normalized[key] = value === 1;
      return;
    }
    if (JSON_COLUMNS.has(key) && typeof value === 'string') {
      try {
        normalized[key] = JSON.parse(value);
      } catch (err) {
        normalized[key] = value;
      }
    }
  });

  return normalized;
};

const toDbValue = (value) => {
  if (value === undefined) {
    return null;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (Buffer.isBuffer(value)) {
    return value;
  }
  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }
  return value;
};

const normalizeRows = (rows) => rows.map((row) => normalizeRow(row));

const executeAll = async (client, sql, params = []) => {
  const rows = await client.all(sql, params);
  return normalizeRows(rows);
};

const executeGet = async (client, sql, params = []) => {
  const row = await client.get(sql, params);
  return row ? normalizeRow(row) : null;
};

const inferColumnType = (columnName, value) => {
  const normalizedName = columnName ? String(columnName) : '';
  if (
    normalizedName.startsWith('is_') ||
    normalizedName.startsWith('has_') ||
    normalizedName.startsWith('can_') ||
    normalizedName.endsWith('_enabled')
  ) {
    return 'INTEGER';
  }
  if (normalizedName.endsWith('_at') || normalizedName.endsWith('At')) {
    return 'INTEGER';
  }
  if (value === undefined || value === null) {
    return 'TEXT';
  }
  if (typeof value === 'boolean') {
    return 'INTEGER';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'INTEGER' : 'REAL';
  }
  if (Buffer.isBuffer(value)) {
    return 'BLOB';
  }
  if (typeof value === 'object') {
    return 'TEXT';
  }
  return 'TEXT';
};

const ownerScopedTableSql = (tableName, idField = 'id') => `
  CREATE TABLE IF NOT EXISTS ${quoteIdentifier(tableName)} (
    ${quoteIdentifier(idField)} TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    created_at INTEGER,
    updated_at INTEGER,
    is_deleted INTEGER DEFAULT 0,
    is_synced INTEGER DEFAULT 0,
    PRIMARY KEY (ownerId, ${quoteIdentifier(idField)})
  )
`;

const buildSchemaStatements = () => [
  ownerScopedTableSql('menu_items'),
  ownerScopedTableSql('tables'),
  ownerScopedTableSql('table_zones'),
  ownerScopedTableSql('inventory_items'),
  ownerScopedTableSql('bills'),
  ownerScopedTableSql('payments'),
  ownerScopedTableSql('categories'),
  ownerScopedTableSql('delivery_platforms'),
  ownerScopedTableSql('bill_items'),
  ownerScopedTableSql('recipe_items'),
  ownerScopedTableSql('inventory_waste'),
  ownerScopedTableSql('pricing_settings'),
  ownerScopedTableSql('discount_rules'),
  ownerScopedTableSql('payment_methods'),
  ownerScopedTableSql('invoice_voids'),
  ownerScopedTableSql('business_rules'),
  ownerScopedTableSql('receipt_config'),
  ownerScopedTableSql('printer_settings'),
  ownerScopedTableSql('store_profile'),
  ownerScopedTableSql('staff_users'),
  ownerScopedTableSql('sync_settings'),
  ownerScopedTableSql('outbox'),
  ownerScopedTableSql('inventory_deductions', 'bill_id'),
  `
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      title TEXT,
      amount REAL,
      category TEXT,
      note TEXT,
      created_at INTEGER,
      updated_at INTEGER,
      spent_at INTEGER,
      is_deleted INTEGER DEFAULT 0,
      is_synced INTEGER DEFAULT 0,
      spentAt INTEGER,
      updatedAt INTEGER,
      isDeleted INTEGER DEFAULT 0,
      PRIMARY KEY (ownerId, id)
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS auth_users (
      uid TEXT PRIMARY KEY,
      email TEXT,
      emailLower TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT,
      ownerId TEXT,
      created_at INTEGER,
      updated_at INTEGER
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS user_profiles (
      uid TEXT PRIMARY KEY,
      email TEXT,
      emailLower TEXT,
      ownerEmail TEXT,
      ownerId TEXT,
      role TEXT,
      permissions TEXT,
      isSuperAdmin INTEGER,
      updatedAt INTEGER
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS subscriptions (
      uid TEXT PRIMARY KEY,
      isPremium INTEGER,
      expiryDate INTEGER,
      planName TEXT,
      updatedAt INTEGER
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS payment_settings (
      singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
      companyName TEXT DEFAULT '',
      kpayPhone TEXT,
      viberNumber TEXT,
      telegramUsername TEXT,
      price1Month REAL,
      price3Months REAL,
      price6Months REAL,
      price12Months REAL,
      updatedAt INTEGER
    )
  `,
  'CREATE INDEX IF NOT EXISTS idx_auth_users_email_lower ON auth_users(emailLower)',
  'CREATE INDEX IF NOT EXISTS idx_auth_users_owner_id ON auth_users(ownerId)',
  'CREATE INDEX IF NOT EXISTS idx_user_profiles_owner_email ON user_profiles(ownerEmail)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_owner_updated_at ON expenses(ownerId, updatedAt)',
  'CREATE INDEX IF NOT EXISTS idx_expenses_owner_spent_at ON expenses(ownerId, spentAt)'
];

const initSchema = async (client) => {
  await client.exec('PRAGMA journal_mode = WAL');
  await client.exec('PRAGMA foreign_keys = ON');
  const statements = buildSchemaStatements();
  for (const sql of statements) {
    await client.exec(sql);
  }

  const baselineColumns = {
    is_deleted: 0,
    is_synced: 0
  };

  for (const tableName of DB_ADAPTER_TABLES) {
    if (tableName === 'expenses') {
      await ensureColumns(
        tableName,
        {
          ...baselineColumns,
          created_at: 0,
          updated_at: 0,
          spent_at: 0
        },
        client
      );
      continue;
    }
    await ensureColumns(tableName, baselineColumns, client);
  }
};

const getDb = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  const resolvedPath = path.resolve(process.cwd(), sqlitePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

  dbInstance = await open({
    filename: resolvedPath,
    driver: sqlite3.Database
  });

  await initSchema(dbInstance);
  return dbInstance;
};

const connectDB = async () => {
  await getDb();
};

const all = async (sql, params = []) => {
  const client = await getDb();
  return executeAll(client, sql, params);
};

const get = async (sql, params = []) => {
  const client = await getDb();
  return executeGet(client, sql, params);
};

const run = async (sql, params = []) => {
  const client = await getDb();
  return client.run(sql, params);
};

const exec = async (sql) => {
  const client = await getDb();
  return client.exec(sql);
};

const fetchTableColumns = async (tableName, client) => {
  const rows = await client.all(`PRAGMA table_info(${quoteIdentifier(tableName)})`);
  return new Set(rows.map((row) => row.name));
};

const ensureColumns = async (tableName, values, clientOverride) => {
  if (!values || typeof values !== 'object') {
    return;
  }
  if (!ALLOWED_TABLES.has(tableName)) {
    throw new Error(`Unknown table: ${tableName}`);
  }

  const client = clientOverride || (await getDb());
  if (!tableColumnCache.has(tableName)) {
    tableColumnCache.set(tableName, await fetchTableColumns(tableName, client));
  }

  const cachedColumns = tableColumnCache.get(tableName);
  for (const [key, rawValue] of Object.entries(values)) {
    if (key === undefined || key === null) {
      continue;
    }
    assertSafeIdentifier(key);
    if (cachedColumns.has(key)) {
      continue;
    }
    const columnType = inferColumnType(key, rawValue);
    let defaultClause = '';
    if (rawValue !== undefined && rawValue !== null) {
      if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
        defaultClause = ` DEFAULT ${rawValue}`;
      } else if (typeof rawValue === 'boolean') {
        defaultClause = ` DEFAULT ${rawValue ? 1 : 0}`;
      }
    }
    await client.exec(
      `ALTER TABLE ${quoteIdentifier(tableName)} ADD COLUMN ${quoteIdentifier(key)} ${columnType}${defaultClause}`
    );
    cachedColumns.add(key);
  }
};

const withTransaction = async (callback) => {
  const client = await getDb();
  await client.exec('BEGIN IMMEDIATE TRANSACTION');

  try {
    const tx = {
      all: (sql, params = []) => executeAll(client, sql, params),
      get: (sql, params = []) => executeGet(client, sql, params),
      run: (sql, params = []) => client.run(sql, params),
      exec: (sql) => client.exec(sql),
      ensureColumns: (tableName, values) => ensureColumns(tableName, values, client)
    };
    const result = await callback(tx);
    await client.exec('COMMIT');
    return result;
  } catch (err) {
    await client.exec('ROLLBACK');
    throw err;
  }
};

module.exports = {
  DB_ADAPTER_TABLES,
  MANAGED_TABLES,
  connectDB,
  getDb,
  all,
  get,
  run,
  exec,
  ensureColumns,
  withTransaction,
  assertSafeIdentifier,
  quoteIdentifier,
  toDbValue,
  normalizeRow
};
