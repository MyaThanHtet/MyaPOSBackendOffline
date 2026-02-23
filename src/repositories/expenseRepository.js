const { all, get, run, quoteIdentifier, toDbValue } = require('../config/db');
const { buildWhereClause } = require('./sqlUtils');

const TABLE = 'expenses';

const list = async (filter = {}, options = {}) => {
  const page = options.page || 1;
  const limit = options.limit || 50;
  const offset = (page - 1) * limit;
  const where = buildWhereClause(filter);

  const items = await all(
    `SELECT * FROM ${quoteIdentifier(TABLE)} ${where.sql} ORDER BY spentAt DESC, updatedAt DESC LIMIT ? OFFSET ?`.trim(),
    [...where.args, limit, offset]
  );

  const countRow = await get(
    `SELECT COUNT(*) AS total FROM ${quoteIdentifier(TABLE)} ${where.sql}`.trim(),
    where.args
  );
  const total = Number(countRow?.total || 0);

  return {
    items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

const create = async (data) => {
  const payload = { ...data };
  const columns = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const values = columns.map((key) => toDbValue(payload[key]));
  const sql = `INSERT INTO ${quoteIdentifier(TABLE)} (${columns.map((column) => quoteIdentifier(column)).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`;
  const result = await run(sql, values);
  return get(`SELECT * FROM ${quoteIdentifier(TABLE)} WHERE rowid = ?`, [result.lastID]);
};

const upsertByOwnerAndId = async (ownerId, id, data) => {
  const payload = { ...data, ownerId, id };
  const columns = Object.keys(payload).filter((key) => payload[key] !== undefined);
  const values = columns.map((key) => toDbValue(payload[key]));
  const columnSql = columns.map((column) => quoteIdentifier(column)).join(', ');
  const placeholderSql = columns.map(() => '?').join(', ');
  const updates = columns
    .filter((column) => !['ownerId', 'id'].includes(column))
    .map((column) => `${quoteIdentifier(column)} = excluded.${quoteIdentifier(column)}`)
    .join(', ');

  const sql = `INSERT INTO ${quoteIdentifier(TABLE)} (${columnSql}) VALUES (${placeholderSql}) ON CONFLICT (ownerId, id) DO UPDATE SET ${updates}`;
  await run(sql, values);

  return get(`SELECT * FROM ${quoteIdentifier(TABLE)} WHERE ownerId = ? AND id = ?`, [ownerId, id]);
};

const softDeleteByOwnerAndId = async (ownerId, id, updatedAt) => {
  const result = await run(
    `UPDATE ${quoteIdentifier(TABLE)} SET isDeleted = 1, updatedAt = ? WHERE ownerId = ? AND id = ?`,
    [updatedAt, ownerId, id]
  );
  if (!result?.changes) {
    return null;
  }
  return get(`SELECT * FROM ${quoteIdentifier(TABLE)} WHERE ownerId = ? AND id = ?`, [ownerId, id]);
};

const summary = async (filter = {}) => {
  const where = buildWhereClause(filter);
  const row = await get(
    `SELECT COALESCE(SUM(amount), 0) AS totalExpense, COUNT(*) AS count FROM ${quoteIdentifier(TABLE)} ${where.sql}`.trim(),
    where.args
  );
  return row || { totalExpense: 0, count: 0 };
};

module.exports = {
  list,
  create,
  upsertByOwnerAndId,
  softDeleteByOwnerAndId,
  summary
};
