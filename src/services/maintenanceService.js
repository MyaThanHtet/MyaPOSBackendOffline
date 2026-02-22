const models = require('../models');
const { entityConfigs } = require('../config/entities');
const { badRequest } = require('../utils/errors');

const shouldSkipModel = (name) => name === 'AuthUser';

const clearAllData = async () => {
  const modelEntries = Object.entries(models);
  const cleared = [];
  const skipped = [];

  await Promise.all(
    modelEntries.map(async ([name, model]) => {
      if (!model || typeof model.deleteMany !== 'function' || shouldSkipModel(name)) {
        skipped.push(name);
        return;
      }

      const result = await model.deleteMany({});
      cleared.push({ model: name, deletedCount: result?.deletedCount ?? 0 });
    })
  );

  cleared.sort((a, b) => a.model.localeCompare(b.model));
  skipped.sort();

  return { cleared, skipped };
};

const clearOwnerData = async (ownerId) => {
  const trimmed = ownerId ? String(ownerId).trim() : '';
  if (!trimmed) {
    throw badRequest('ownerId is required');
  }

  const entries = Object.values(entityConfigs);
  const cleared = [];

  await Promise.all(
    entries.map(async (config) => {
      const model = config.model;
      if (!model || typeof model.deleteMany !== 'function') {
        return;
      }
      const result = await model.deleteMany({ ownerId: trimmed });
      cleared.push({
        entity: config.entity,
        model: model.modelName,
        deletedCount: result?.deletedCount ?? 0
      });
    })
  );

  cleared.sort((a, b) => a.entity.localeCompare(b.entity));

  return { ownerId: trimmed, cleared };
};

module.exports = {
  clearAllData,
  clearOwnerData
};
