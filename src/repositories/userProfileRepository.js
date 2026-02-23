const { all, get, run, toDbValue } = require('../config/db');

const TABLE = 'user_profiles';

const serializePermissions = (value) => {
  if (value === undefined) {
    return undefined;
  }
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value);
};

const normalizeProfileRow = (row) => {
  if (!row) {
    return row;
  }
  const normalized = { ...row };
  if (typeof normalized.permissions === 'string') {
    try {
      normalized.permissions = JSON.parse(normalized.permissions);
    } catch (err) {
      normalized.permissions = normalized.permissions;
    }
  }
  return normalized;
};

const normalizeRows = (rows) => rows.map((row) => normalizeProfileRow(row));

const findByUid = async (uid) => normalizeProfileRow(await get(`SELECT * FROM ${TABLE} WHERE uid = ? LIMIT 1`, [uid]));

const upsertByUid = async (uid, data) => {
  const existing = await findByUid(uid);
  const payload = {
    uid,
    email: data.email !== undefined ? data.email : (existing?.email ?? null),
    emailLower: data.emailLower !== undefined ? data.emailLower : (existing?.emailLower ?? null),
    ownerEmail: data.ownerEmail !== undefined ? data.ownerEmail : (existing?.ownerEmail ?? null),
    ownerId: data.ownerId !== undefined ? data.ownerId : (existing?.ownerId ?? null),
    role: data.role !== undefined ? data.role : (existing?.role ?? null),
    permissions:
      data.permissions !== undefined
        ? serializePermissions(data.permissions)
        : serializePermissions(existing?.permissions),
    isSuperAdmin:
      data.isSuperAdmin !== undefined
        ? (data.isSuperAdmin ? 1 : 0)
        : existing?.isSuperAdmin === undefined || existing?.isSuperAdmin === null
          ? null
          : (existing.isSuperAdmin ? 1 : 0),
    updatedAt: data.updatedAt !== undefined ? data.updatedAt : (existing?.updatedAt ?? null)
  };

  await run(
    `INSERT INTO ${TABLE} (uid, email, emailLower, ownerEmail, ownerId, role, permissions, isSuperAdmin, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (uid) DO UPDATE SET
       email = excluded.email,
       emailLower = excluded.emailLower,
       ownerEmail = excluded.ownerEmail,
       ownerId = excluded.ownerId,
       role = excluded.role,
       permissions = excluded.permissions,
       isSuperAdmin = excluded.isSuperAdmin,
       updatedAt = excluded.updatedAt`,
    Object.values(payload).map((value) => toDbValue(value))
  );

  return findByUid(uid);
};

const findByOwnerEmail = async (ownerEmail) =>
  normalizeRows(await all(`SELECT * FROM ${TABLE} WHERE ownerEmail = ? ORDER BY updatedAt DESC`, [ownerEmail]));

const findAll = async () => normalizeRows(await all(`SELECT * FROM ${TABLE} ORDER BY updatedAt DESC`));

const updateByUid = async (uid, data) => {
  const assignments = [];
  const values = [];

  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    if (key === 'permissions') {
      assignments.push(`${key} = ?`);
      values.push(serializePermissions(value));
      return;
    }
    if (key === 'isSuperAdmin') {
      assignments.push(`${key} = ?`);
      values.push(value ? 1 : 0);
      return;
    }
    assignments.push(`${key} = ?`);
    values.push(value);
  });

  if (assignments.length === 0) {
    return findByUid(uid);
  }

  await run(`UPDATE ${TABLE} SET ${assignments.join(', ')} WHERE uid = ?`, [...values, uid]);
  return findByUid(uid);
};

const buildEmailWhere = (email) => {
  const trimmed = String(email).trim();
  const lowered = trimmed.toLowerCase();
  return {
    sql: '(emailLower = ? OR lower(email) = ? OR lower(ownerEmail) = ?)',
    args: [lowered, lowered, lowered]
  };
};

const findByEmail = async (email) => {
  const where = buildEmailWhere(email);
  return normalizeRows(await all(`SELECT * FROM ${TABLE} WHERE ${where.sql} ORDER BY updatedAt DESC`, where.args));
};

const findByUidOrOwnerId = async (id) =>
  normalizeRows(await all(`SELECT * FROM ${TABLE} WHERE uid = ? OR ownerId = ? ORDER BY updatedAt DESC`, [id, id]));

const findAllPaged = async (skip, limit) => {
  const items = await all(`SELECT * FROM ${TABLE} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`, [limit, skip]);
  const totalRow = await get(`SELECT COUNT(*) AS total FROM ${TABLE}`);
  return [normalizeRows(items), Number(totalRow?.total || 0)];
};

const findByOwnerEmailPaged = async (ownerEmail, skip, limit) => {
  const items = await all(
    `SELECT * FROM ${TABLE} WHERE ownerEmail = ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
    [ownerEmail, limit, skip]
  );
  const totalRow = await get(`SELECT COUNT(*) AS total FROM ${TABLE} WHERE ownerEmail = ?`, [ownerEmail]);
  return [normalizeRows(items), Number(totalRow?.total || 0)];
};

const findByEmailPaged = async (email, skip, limit) => {
  const where = buildEmailWhere(email);
  const items = await all(
    `SELECT * FROM ${TABLE} WHERE ${where.sql} ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
    [...where.args, limit, skip]
  );
  const totalRow = await get(`SELECT COUNT(*) AS total FROM ${TABLE} WHERE ${where.sql}`, where.args);
  return [normalizeRows(items), Number(totalRow?.total || 0)];
};

const findByUidOrOwnerIdPaged = async (id, skip, limit) => {
  const items = await all(
    `SELECT * FROM ${TABLE} WHERE uid = ? OR ownerId = ? ORDER BY updatedAt DESC LIMIT ? OFFSET ?`,
    [id, id, limit, skip]
  );
  const totalRow = await get(`SELECT COUNT(*) AS total FROM ${TABLE} WHERE uid = ? OR ownerId = ?`, [id, id]);
  return [normalizeRows(items), Number(totalRow?.total || 0)];
};

module.exports = {
  findByUid,
  upsertByUid,
  findByOwnerEmail,
  findAll,
  updateByUid,
  findByEmail,
  findByUidOrOwnerId,
  findAllPaged,
  findByOwnerEmailPaged,
  findByEmailPaged,
  findByUidOrOwnerIdPaged
};
