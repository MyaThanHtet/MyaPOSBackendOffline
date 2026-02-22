const { UserProfile } = require('../models');

const findByUid = (uid) => UserProfile.findOne({ uid });
const upsertByUid = (uid, data) =>
  UserProfile.findOneAndUpdate({ uid }, { ...data, uid }, { upsert: true, new: true, setDefaultsOnInsert: true });
const findByOwnerEmail = (ownerEmail) => UserProfile.find({ ownerEmail });
const findAll = () => UserProfile.find({});
const updateByUid = (uid, data) => UserProfile.findOneAndUpdate({ uid }, { $set: data }, { new: true });

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildEmailFilter = (email) => {
  const trimmed = String(email).trim();
  const emailLower = trimmed.toLowerCase();
  const exactInsensitive = new RegExp(`^${escapeRegex(trimmed)}$`, 'i');
  return {
    $or: [
      { emailLower },
      { email: exactInsensitive },
      { ownerEmail: exactInsensitive }
    ]
  };
};

const buildUidOrOwnerIdFilter = (id) => ({ $or: [{ uid: id }, { ownerId: id }] });

const findByEmail = (email) => UserProfile.find(buildEmailFilter(email));
const findByUidOrOwnerId = (id) => UserProfile.find(buildUidOrOwnerIdFilter(id));

const findAllPaged = (skip, limit) =>
  Promise.all([
    UserProfile.find({}).skip(skip).limit(limit),
    UserProfile.countDocuments({})
  ]);

const findByOwnerEmailPaged = (ownerEmail, skip, limit) =>
  Promise.all([
    UserProfile.find({ ownerEmail }).skip(skip).limit(limit),
    UserProfile.countDocuments({ ownerEmail })
  ]);

const findByEmailPaged = (email, skip, limit) => {
  const filter = buildEmailFilter(email);
  return Promise.all([
    UserProfile.find(filter).skip(skip).limit(limit),
    UserProfile.countDocuments(filter)
  ]);
};

const findByUidOrOwnerIdPaged = (id, skip, limit) => {
  const filter = buildUidOrOwnerIdFilter(id);
  return Promise.all([
    UserProfile.find(filter).skip(skip).limit(limit),
    UserProfile.countDocuments(filter)
  ]);
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
