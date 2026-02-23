const { get, run } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createUser = async (data) => {
  const uid = data.uid || uuidv4();
  await run(
    `INSERT INTO auth_users (uid, email, emailLower, password_hash, role, ownerId, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      uid,
      data.email ?? null,
      data.emailLower ?? (data.email ? String(data.email).toLowerCase() : null),
      data.password_hash ?? '',
      data.role ?? 'user',
      data.ownerId ?? uid,
      data.created_at ?? Date.now(),
      data.updated_at ?? Date.now()
    ]
  );
  return get(`SELECT * FROM auth_users WHERE uid = ?`, [uid]);
};

const findUserByEmail = (email) =>
  get(`SELECT * FROM auth_users WHERE emailLower = ? OR lower(email) = ? LIMIT 1`, [
    String(email).toLowerCase(),
    String(email).toLowerCase()
  ]);

const findUserById = (id) => get(`SELECT * FROM auth_users WHERE uid = ? LIMIT 1`, [id]);

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
