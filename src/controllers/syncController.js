const syncService = require('../services/syncService');
const { resolveOwnerScope } = require('../utils/ownerScope');

const bootstrap = async (req, res, next) => {
  try {
    const ownerId = resolveOwnerScope({ user: req.user, requestedOwnerId: req.query.ownerId });
    const result = await syncService.bootstrap(ownerId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const pull = async (req, res, next) => {
  try {
    const ownerId = resolveOwnerScope({ user: req.user, requestedOwnerId: req.body?.ownerId });
    const result = await syncService.pull({ ...req.body, ownerId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const push = async (req, res, next) => {
  try {
    const ownerId = resolveOwnerScope({ user: req.user, requestedOwnerId: req.body?.ownerId });
    const result = await syncService.push({ ...req.body, ownerId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const pullSingle = async (req, res, next) => {
  try {
    const ownerId = resolveOwnerScope({ user: req.user, requestedOwnerId: req.body?.ownerId });
    const result = await syncService.pullSingle({ ...req.body, ownerId });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  bootstrap,
  pull,
  push,
  pullSingle
};
