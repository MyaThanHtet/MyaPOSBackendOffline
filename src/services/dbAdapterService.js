const { all, run, ensureColumns, quoteIdentifier, toDbValue, DB_ADAPTER_TABLES } = require('../config/db');
const { badRequest, notFound } = require('../utils/errors');
const { parseNumber } = require('../utils/validation');

const allowedTables = new Set(DB_ADAPTER_TABLES);
const allowedConflictAlgorithms = new Set(['rollback', 'abort', 'fail', 'ignore', 'replace']);
const SQLITE_MISSING_COLUMN_RE = /no such column:\s*([A-Za-z_][A-Za-z0-9_]*)/i;

const assertSafeSqlFragment = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const text = String(value).trim();
  if (!text) {
    return '';
  }
  if (text.includes(';') || text.includes('--')) {
    throw badRequest(`${fieldName} contains unsupported SQL tokens`);
  }
  return text;
};

const requireAllowedTable = (table) => {
  const normalized = String(table || '').trim();
  if (!normalized) {
    throw badRequest('table is required');
  }
  if (!allowedTables.has(normalized)) {
    throw notFound('Unknown table');
  }
  return normalized;
};

const parseWhereArgs = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        throw new Error('not array');
      }
      return parsed;
    } catch (err) {
      throw badRequest(`${fieldName} must be a JSON array`);
    }
  }
  throw badRequest(`${fieldName} must be an array`);
};

const normalizeColumns = (value) => {
  if (value === undefined || value === null || value === '') {
    return '*';
  }
  const columns = assertSafeSqlFragment(value, 'columns');
  return columns || '*';
};

const normalizeLimit = (value, fieldName) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const parsed = parseNumber(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw badRequest(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
};

const normalizeConflictAlgorithm = (value) => {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  const normalized = String(value).toLowerCase();
  if (!allowedConflictAlgorithms.has(normalized)) {
    throw badRequest('conflictAlgorithm is invalid');
  }
  return `OR ${normalized.toUpperCase()}`;
};

const toSqliteCompatValue = (value) => {
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return value.map((item) => toSqliteCompatValue(item));
  }
  if (value && typeof value === 'object') {
    const normalized = {};
    Object.entries(value).forEach(([key, innerValue]) => {
      normalized[key] = toSqliteCompatValue(innerValue);
    });
    return normalized;
  }
  return value;
};

const toSqliteCompatRows = (rows) => rows.map((row) => toSqliteCompatValue(row));

const getMissingColumnName = (err) => {
  const text = String(err?.message || '');
  const match = text.match(SQLITE_MISSING_COLUMN_RE);
  return match ? match[1] : null;
};

const defaultValueForMissingColumn = (columnName) => {
  if (!columnName) {
    return null;
  }
  if (columnName.startsWith('is_') || columnName.startsWith('has_')) {
    return 0;
  }
  if (columnName.endsWith('_at')) {
    return 0;
  }
  return null;
};

const executeWithAutoColumn = async (tableName, executor) => {
  let attempt = 0;
  while (attempt < 3) {
    try {
      return await executor();
    } catch (err) {
      const missingColumn = getMissingColumnName(err);
      if (!missingColumn) {
        throw err;
      }
      await ensureColumns(tableName, { [missingColumn]: defaultValueForMissingColumn(missingColumn) });
      attempt += 1;
    }
  }
  return executor();
};

const queryTable = async (table, query = {}) => {
  const tableName = requireAllowedTable(table);
  const columns = normalizeColumns(query.columns);
  const distinct = String(query.distinct || '').toLowerCase() === 'true' ? 'DISTINCT ' : '';
  const whereSql = assertSafeSqlFragment(query.where, 'where');
  const whereArgs = parseWhereArgs(query.whereArgs, 'whereArgs');
  const groupBy = assertSafeSqlFragment(query.groupBy, 'groupBy');
  const having = assertSafeSqlFragment(query.having, 'having');
  const orderBy = assertSafeSqlFragment(query.orderBy, 'orderBy');
  const limit = normalizeLimit(query.limit, 'limit');
  const offset = normalizeLimit(query.offset, 'offset');

  let sql = `SELECT ${distinct}${columns} FROM ${quoteIdentifier(tableName)}`;
  const params = [...whereArgs];

  if (whereSql) {
    sql += ` WHERE ${whereSql}`;
  }
  if (groupBy) {
    sql += ` GROUP BY ${groupBy}`;
  }
  if (having) {
    sql += ` HAVING ${having}`;
  }
  if (orderBy) {
    sql += ` ORDER BY ${orderBy}`;
  }
  if (limit !== undefined) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  if (offset !== undefined) {
    sql += ' OFFSET ?';
    params.push(offset);
  }

  const rows = await executeWithAutoColumn(tableName, () => all(sql, params));
  return toSqliteCompatRows(rows);
};

const insertIntoTable = async (table, body = {}) => {
  const tableName = requireAllowedTable(table);
  const values = body.values && typeof body.values === 'object' ? { ...body.values } : {};
  const nullColumnHack = body.nullColumnHack ? String(body.nullColumnHack).trim() : '';

  if (tableName === 'outbox' && values.ownerId === undefined) {
    values.ownerId = '';
  }

  if (Object.keys(values).length === 0) {
    if (!nullColumnHack) {
      throw badRequest('values is required');
    }
    values[nullColumnHack] = null;
  }

  await ensureColumns(tableName, values);

  const columns = Object.keys(values).filter((key) => values[key] !== undefined);
  const params = columns.map((column) => toDbValue(values[column]));
  const conflictAlgorithm = normalizeConflictAlgorithm(body.conflictAlgorithm);

  const sql = `INSERT ${conflictAlgorithm} INTO ${quoteIdentifier(tableName)} (${columns.map((column) => quoteIdentifier(column)).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  const result = await executeWithAutoColumn(tableName, () => run(sql, params));
  return {
    changes: result?.changes ?? 0,
    id: result?.lastID ?? null
  };
};

const updateTable = async (table, body = {}) => {
  const tableName = requireAllowedTable(table);
  const values = body.values && typeof body.values === 'object' ? { ...body.values } : null;
  if (!values) {
    throw badRequest('values is required');
  }

  await ensureColumns(tableName, values);

  const columns = Object.keys(values).filter((key) => values[key] !== undefined);
  if (columns.length === 0) {
    throw badRequest('values must include at least one field');
  }

  const whereSql = assertSafeSqlFragment(body.where, 'where');
  const whereArgs = parseWhereArgs(body.whereArgs, 'whereArgs');
  const sql = `UPDATE ${quoteIdentifier(tableName)} SET ${columns.map((column) => `${quoteIdentifier(column)} = ?`).join(', ')}${whereSql ? ` WHERE ${whereSql}` : ''}`;
  const params = [...columns.map((column) => toDbValue(values[column])), ...whereArgs];
  const result = await run(sql, params);

  return {
    changes: result?.changes ?? 0,
    count: result?.changes ?? 0
  };
};

const deleteFromTable = async (table, body = {}) => {
  const tableName = requireAllowedTable(table);
  const whereSql = assertSafeSqlFragment(body.where, 'where');
  const whereArgs = parseWhereArgs(body.whereArgs, 'whereArgs');
  const sql = `DELETE FROM ${quoteIdentifier(tableName)}${whereSql ? ` WHERE ${whereSql}` : ''}`;
  const result = await executeWithAutoColumn(tableName, () => run(sql, whereArgs));

  return {
    changes: result?.changes ?? 0,
    count: result?.changes ?? 0
  };
};

const normalizeRawInput = (body = {}) => {
  const sql = assertSafeSqlFragment(body.sql, 'sql');
  if (!sql) {
    throw badRequest('sql is required');
  }
  const args = parseWhereArgs(body.arguments, 'arguments');
  return { sql, args };
};

const rawQuery = async (body = {}) => {
  const { sql, args } = normalizeRawInput(body);
  const rows = await all(sql, args);
  return toSqliteCompatRows(rows);
};

const rawUpdate = async (body = {}) => {
  const { sql, args } = normalizeRawInput(body);
  const result = await run(sql, args);
  return {
    changes: result?.changes ?? 0,
    affectedRows: result?.changes ?? 0,
    id: result?.lastID ?? null
  };
};

const rawDelete = (body = {}) => rawUpdate(body);

const executeStatement = async (body = {}) => {
  const { sql, args } = normalizeRawInput(body);
  const result = await run(sql, args);
  return {
    changes: result?.changes ?? 0,
    affectedRows: result?.changes ?? 0,
    id: result?.lastID ?? null
  };
};

module.exports = {
  queryTable,
  insertIntoTable,
  updateTable,
  deleteFromTable,
  rawQuery,
  rawUpdate,
  rawDelete,
  executeStatement
};
