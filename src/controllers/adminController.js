const userService = require('../services/userService');
const paymentSettingsService = require('../services/paymentSettingsService');
const { clearAllData } = require('../services/maintenanceService');

const listUsersByOwnerEmail = async (req, res, next) => {
  try {
    const users = await userService.listUsersByOwnerEmail(req.query.ownerEmail, req.query.page, req.query.limit);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const searchUsers = async (req, res, next) => {
  try {
    const users = await userService.searchUsers(req.query.query, req.query.page, req.query.limit);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const listAuthEmails = async (req, res, next) => {
  try {
    const result = await userService.listAuthEmails(req.query.query, req.query.page, req.query.limit);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const setUserRole = async (req, res, next) => {
  try {
    const result = await userService.setUserRole(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const setSuperAdmin = async (req, res, next) => {
  try {
    const result = await userService.setUserRole({ ...req.body, role: 'super_admin' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const clearData = async (req, res, next) => {
  try {
    const result = await clearAllData();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const upsertUserByUid = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const profile = await userService.upsertUserByUid(uid, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const getPaymentSettings = async (req, res, next) => {
  try {
    const settings = await paymentSettingsService.getPaymentSettings();
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

const upsertPaymentSettings = async (req, res, next) => {
  try {
    const settings = await paymentSettingsService.upsertPaymentSettings(req.body);
    res.json(settings);
  } catch (err) {
    next(err);
  }
};

const upsertSubscription = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const subscription = await userService.upsertSubscription(uid, req.body);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listUsersByOwnerEmail,
  searchUsers,
  listAuthEmails,
  setUserRole,
  setSuperAdmin,
  clearData,
  upsertUserByUid,
  getPaymentSettings,
  upsertPaymentSettings,
  upsertSubscription
};
