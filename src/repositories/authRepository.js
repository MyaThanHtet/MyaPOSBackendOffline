const { all, get, run } = require('../config/db');

const TABLE = 'auth_users';

const findByEmailLower = (emailLower) => get(`SELECT * FROM ${TABLE} WHERE emailLower = ? LIMIT 1`, [emailLower]);
const findByUid = (uid) => get(`SELECT * FROM ${TABLE} WHERE uid = ? LIMIT 1`, [uid]);

const createAuthUser = async (data) => {
  await run(
    `INSERT INTO ${TABLE} (uid, email, emailLower, password_hash, role, ownerId, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.uid,
      data.email ?? null,
      data.emailLower ?? null,
      data.password_hash,
      data.role ?? 'user',
      data.ownerId ?? null,
      data.created_at ?? null,
      data.updated_at ?? null
    ]
  );
  return findByUid(data.uid);
};

const countAuthUsers = async () => {
  const row = await get(`SELECT COUNT(*) AS total FROM ${TABLE}`);
  return Number(row?.total || 0);
};

const updateRoleByEmailLower = async (emailLower, role, updated_at) => {
  await run(`UPDATE ${TABLE} SET role = ?, updated_at = ? WHERE emailLower = ?`, [role, updated_at, emailLower]);
  return findByEmailLower(emailLower);
};

const updateRoleByUid = async (uid, role, updated_at) => {
  await run(`UPDATE ${TABLE} SET role = ?, updated_at = ? WHERE uid = ?`, [role, updated_at, uid]);
  return findByUid(uid);
};

const updateOwnerIdByUid = async (uid, ownerId, updated_at) => {
  await run(`UPDATE ${TABLE} SET ownerId = ?, updated_at = ? WHERE uid = ?`, [ownerId, updated_at, uid]);
  return findByUid(uid);
};

const findEmailsPaged = async (query, skip, limit) => {
  const whereSql = query ? 'WHERE emailLower LIKE ?' : '';
  const args = query ? [`%${String(query).toLowerCase()}%`] : [];

  const items = await all(
    `SELECT uid, email, emailLower FROM ${TABLE} ${whereSql} ORDER BY emailLower ASC LIMIT ? OFFSET ?`,
    [...args, limit, skip]
  );
  const totalRow = await get(`SELECT COUNT(*) AS total FROM ${TABLE} ${whereSql}`, args);
  return [items, Number(totalRow?.total || 0)];
};

module.exports = {
  findByEmailLower,
  findByUid,
  createAuthUser,
  countAuthUsers,
  updateRoleByEmailLower,
  updateRoleByUid,
  updateOwnerIdByUid,
  findEmailsPaged
};
