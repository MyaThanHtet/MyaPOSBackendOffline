const { PaymentSettings } = require('../models');

const getSettings = () => PaymentSettings.findOne({});
const upsertSettings = (data) =>
  PaymentSettings.findOneAndUpdate({}, data, { upsert: true, new: true, setDefaultsOnInsert: true });

module.exports = {
  getSettings,
  upsertSettings
};
