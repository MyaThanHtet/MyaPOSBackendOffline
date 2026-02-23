const { all, get, run, ensureColumns, quoteIdentifier, toDbValue } = require('../config/db');
const { getTableName, buildWhereClause, buildOrderClause, cleanData } = require('./sqlUtils');

const list = async (Model, filter = {}, sort) => {
  const tableName = getTableName(Model);
  const where = buildWhereClause(filter);
  const orderBy = buildOrderClause(sort);
  const sql = `SELECT * FROM ${quoteIdentifier(tableName)} ${where.sql} ${orderBy}`.trim();
  return all(sql, where.args);
};

const upsert = async (Model, filter = {}, data = {}) => {
  const tableName = getTableName(Model);
  const merged = cleanData({ ...data });

  Object.entries(filter).forEach(([key, value]) => {
    if (merged[key] === undefined && value !== undefined && (value === null || typeof value !== 'object')) {
      merged[key] = value;
    }
  });

  const columns = Object.keys(merged);
  if (columns.length === 0) {
    return null;
  }

  await ensureColumns(tableName, merged);

  const columnSql = columns.map((column) => quoteIdentifier(column)).join(', ');
  const placeholderSql = columns.map(() => '?').join(', ');
  const values = columns.map((column) => toDbValue(merged[column]));

  const conflictKeys = Object.entries(filter)
    .filter(([, value]) => value !== undefined && (value === null || typeof value !== 'object'))
    .map(([key]) => key);
  const conflictSql = conflictKeys.length
    ? `(${conflictKeys.map((key) => quoteIdentifier(key)).join(', ')})`
    : '';

  const updatableColumns = columns.filter((column) => !conflictKeys.includes(column));
  const updateSql = updatableColumns.length
    ? `DO UPDATE SET ${updatableColumns.map((column) => `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`).join(', ')}`
    : 'DO NOTHING';

  const sql = conflictKeys.length
    ? `INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES (${placeholderSql}) ON CONFLICT ${conflictSql} ${updateSql}`
    : `INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES (${placeholderSql})`;

  const result = await run(sql, values);

  if (Object.keys(filter).length > 0) {
    const where = buildWhereClause(filter);
    return get(
      `SELECT * FROM ${quoteIdentifier(tableName)} ${where.sql} LIMIT 1`.trim(),
      where.args
    );
  }

  if (result?.lastID !== undefined) {
    return get(`SELECT * FROM ${quoteIdentifier(tableName)} WHERE rowid = ?`, [result.lastID]);
  }

  return null;
};

const remove = async (Model, filter = {}) => {
  const tableName = getTableName(Model);
  const where = buildWhereClause(filter);
  const existing = await get(
    `SELECT * FROM ${quoteIdentifier(tableName)} ${where.sql} LIMIT 1`.trim(),
    where.args
  );
  if (!existing) {
    return null;
  }
  await run(`DELETE FROM ${quoteIdentifier(tableName)} ${where.sql}`.trim(), where.args);
  return existing;
};

const update = async (Model, filter = {}, data = {}) => {
  const tableName = getTableName(Model);
  const payload = cleanData(data);
  const columns = Object.keys(payload);

  if (columns.length === 0) {
    return null;
  }

  await ensureColumns(tableName, payload);

  const where = buildWhereClause(filter);
  const setSql = columns.map((column) => `${quoteIdentifier(column)} = ?`).join(', ');
  const args = [...columns.map((column) => toDbValue(payload[column])), ...where.args];
  const result = await run(
    `UPDATE ${quoteIdentifier(tableName)} SET ${setSql} ${where.sql}`.trim(),
    args
  );

  if (!result?.changes) {
    return null;
  }

  return get(
    `SELECT * FROM ${quoteIdentifier(tableName)} ${where.sql} LIMIT 1`.trim(),
    where.args
  );
};

module.exports = {
  list,
  upsert,
  remove,
  update
};
