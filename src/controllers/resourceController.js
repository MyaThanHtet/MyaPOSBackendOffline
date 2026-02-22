const { listResources, upsertResource, deleteResource } = require('../services/resourceService');
const { ensureIdMatch } = require('../utils/validation');
const { forbidden } = require('../utils/errors');

const list = (config) => async (req, res, next) => {
  try {
    const ownerId = req.user?.ownerId;
    if (ownerId && req.query.ownerId && String(req.query.ownerId) !== String(ownerId)) {
      throw forbidden('ownerId does not match token');
    }
    const query = ownerId ? { ...req.query, ownerId } : req.query;
    const data = await listResources(config, query);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

const upsert = (config) => async (req, res, next) => {
  try {
    const ownerId = req.user?.ownerId;
    if (ownerId) {
      if (req.body?.ownerId && String(req.body.ownerId) !== String(ownerId)) {
        throw forbidden('ownerId does not match token');
      }
      if (req.body) {
        req.body.ownerId = ownerId;
      }
    }
    const idValue = req.params[config.paramName];
    if (config.idField && req.body) {
      ensureIdMatch(idValue, req.body[config.idField], config.idField);
    }
    const doc = await upsertResource(config, idValue, req.body);
    res.json(doc);
  } catch (err) {
    next(err);
  }
};

const remove = (config) => async (req, res, next) => {
  try {
    const idValue = req.params[config.paramName];
    const ownerId = req.user?.ownerId || req.query.ownerId;
    if (req.user?.ownerId && req.query.ownerId && String(req.query.ownerId) !== String(req.user.ownerId)) {
      throw forbidden('ownerId does not match token');
    }
    const doc = await deleteResource(config, idValue, ownerId);
    res.json({ id: idValue, deleted: true, resource: doc });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  upsert,
  remove
};
