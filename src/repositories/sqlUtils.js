const { quoteIdentifier, toDbValue } = require('../config/db');

const getTableName = (Model) => {
  const tableName = Model?.tableName;
  if (!tableName) {
    throw new Error('Model tableName is required');
  }
  return tableName;
};

const normalizeFilterEntry = (column, value, clauses, args) => {
  const columnSql = quoteIdentifier(column);

  if (value === undefined) {
    return;
  }

  if (value === null) {
    clauses.push(`${columnSql} IS NULL`);
    return;
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    let handled = false;
    if (value.$gt !== undefined) {
      clauses.push(`${columnSql} > ?`);
      args.push(toDbValue(value.$gt));
      handled = true;
    }
    if (value.$gte !== undefined) {
      clauses.push(`${columnSql} >= ?`);
      args.push(toDbValue(value.$gte));
      handled = true;
    }
    if (value.$lt !== undefined) {
      clauses.push(`${columnSql} < ?`);
      args.push(toDbValue(value.$lt));
      handled = true;
    }
    if (value.$lte !== undefined) {
      clauses.push(`${columnSql} <= ?`);
      args.push(toDbValue(value.$lte));
      handled = true;
    }
    if (value.$ne !== undefined) {
      clauses.push(`${columnSql} <> ?`);
      args.push(toDbValue(value.$ne));
      handled = true;
    }
    if (!handled) {
      clauses.push(`${columnSql} = ?`);
      args.push(toDbValue(value));
    }
    return;
  }

  clauses.push(`${columnSql} = ?`);
  args.push(toDbValue(value));
};

const buildWhereClause = (filter = {}) => {
  const clauses = [];
  const args = [];

  Object.entries(filter).forEach(([column, value]) => {
    normalizeFilterEntry(column, value, clauses, args);
  });

  if (clauses.length === 0) {
    return { sql: '', args };
  }

  return { sql: `WHERE ${clauses.join(' AND ')}`, args };
};

const buildOrderClause = (sort) => {
  if (!sort || typeof sort !== 'object') {
    return '';
  }

  const [field, direction] = Object.entries(sort)[0] || [];
  if (!field) {
    return '';
  }
  const dir = Number(direction) < 0 ? 'DESC' : 'ASC';
  return `ORDER BY ${quoteIdentifier(field)} ${dir}`;
};

const cleanData = (data = {}) => {
  const cleaned = {};
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

module.exports = {
  getTableName,
  buildWhereClause,
  buildOrderClause,
  cleanData
};
