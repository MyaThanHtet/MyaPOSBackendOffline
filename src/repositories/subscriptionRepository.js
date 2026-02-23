const { get, run } = require('../config/db');

const TABLE = 'subscriptions';

const findByUid = (uid) => get(`SELECT * FROM ${TABLE} WHERE uid = ? LIMIT 1`, [uid]);

const upsertByUid = async (uid, data) => {
  await run(
    `INSERT INTO ${TABLE} (uid, isPremium, expiryDate, planName, updatedAt)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (uid) DO UPDATE SET
       isPremium = excluded.isPremium,
       expiryDate = excluded.expiryDate,
       planName = excluded.planName,
       updatedAt = excluded.updatedAt`,
    [
      uid,
      data.isPremium === undefined ? null : (data.isPremium ? 1 : 0),
      data.expiryDate ?? null,
      data.planName ?? null,
      data.updatedAt ?? null
    ]
  );
  return findByUid(uid);
};

module.exports = {
  findByUid,
  upsertByUid
};
