const { Subscription } = require('../models');

const findByUid = (uid) => Subscription.findOne({ uid });
const upsertByUid = (uid, data) =>
  Subscription.findOneAndUpdate({ uid }, { ...data, uid }, { upsert: true, new: true, setDefaultsOnInsert: true });

module.exports = {
  findByUid,
  upsertByUid
};
