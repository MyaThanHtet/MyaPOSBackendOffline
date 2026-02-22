const express = require('express');
const resourceController = require('../controllers/resourceController');

const createResourceRouter = (config, authMiddleware) => {
  const router = express.Router();
  const paramName = config.paramName || 'id';

  router.get('/', authMiddleware, resourceController.list(config));
  router.put(`/:${paramName}`, authMiddleware, resourceController.upsert(config));

  if (config.allowDelete) {
    router.delete(`/:${paramName}`, authMiddleware, resourceController.remove(config));
  }

  return router;
};

module.exports = {
  createResourceRouter
};
