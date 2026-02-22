const userService = require('../services/userService');
const { clearOwnerData } = require('../services/maintenanceService');
const { unauthorized } = require('../utils/errors');

const getMe = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return next(unauthorized('Invalid token'));
    }
    const profile = await userService.getCurrentUser(uid);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const upsertMe = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return next(unauthorized('Invalid token'));
    }
    const profile = await userService.upsertCurrentUser(uid, req.body);
    res.json(profile);
  } catch (err) {
    next(err);
  }
};

const getSubscription = async (req, res, next) => {
  try {
    const { uid } = req.params;
    const subscription = await userService.getSubscription(uid);
    res.json(subscription);
  } catch (err) {
    next(err);
  }
};

const clearMyData = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) {
      return next(unauthorized('Invalid token'));
    }
    const profile = await userService.getCurrentUser(uid);
    const result = await clearOwnerData(profile.ownerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  upsertMe,
  getSubscription,
  clearMyData
};
