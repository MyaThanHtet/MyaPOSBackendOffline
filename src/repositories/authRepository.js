const { AuthUser } = require('../models');

const findByEmailLower = (emailLower) => AuthUser.findOne({ emailLower });
const findByUid = (uid) => AuthUser.findOne({ uid });
const createAuthUser = (data) => AuthUser.create(data);
const countAuthUsers = () => AuthUser.countDocuments({});
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const emailProjection = { uid: 1, email: 1, emailLower: 1 };
const updateRoleByEmailLower = (emailLower, role, updated_at) =>
  AuthUser.findOneAndUpdate(
    { emailLower },
    { $set: { role, updated_at } },
    { new: true }
  );
const updateRoleByUid = (uid, role, updated_at) =>
  AuthUser.findOneAndUpdate(
    { uid },
    { $set: { role, updated_at } },
    { new: true }
  );
const updateOwnerIdByUid = (uid, ownerId, updated_at) =>
  AuthUser.findOneAndUpdate(
    { uid },
    { $set: { ownerId, updated_at } },
    { new: true }
  );

const findEmailsPaged = (query, skip, limit) => {
  const filter = query
    ? { emailLower: { $regex: escapeRegex(String(query).toLowerCase()), $options: 'i' } }
    : {};
  return Promise.all([
    AuthUser.find(filter, emailProjection).skip(skip).limit(limit),
    AuthUser.countDocuments(filter)
  ]);
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
