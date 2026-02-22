const resourceRepository = require('../repositories/resourceRepository');
const { badRequest, notFound } = require('../utils/errors');
const { parseBoolean, parseNumber, ensureTimestamp } = require('../utils/validation');

const applyOutputTransform = (config, doc) => {
  if (!config.transformOutput) {
    return doc;
  }
  return config.transformOutput(doc);
};

const listResources = async (config, query) => {
  const ownerId = query.ownerId;
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }

  const filter = { ownerId };

  if (config.extraFilters?.length) {
    config.extraFilters.forEach((key) => {
      if (query[key] !== undefined) {
        filter[key] = query[key];
      }
    });
  }

  let updatedSince;
  if (query.updated_since !== undefined) {
    updatedSince = parseNumber(query.updated_since);
    if (updatedSince === undefined) {
      throw badRequest('updated_since must be a number');
    }
  }

  if (updatedSince !== undefined && config.timeField) {
    filter[config.timeField] = { $gt: updatedSince };
  }

  const includeDeleted = parseBoolean(query.include_deleted);
  if (config.supportsDeleted && includeDeleted !== true) {
    filter[config.deletedField || 'is_deleted'] = { $ne: true };
  }

  const sort = config.timeField ? { [config.timeField]: 1 } : undefined;
  const docs = await resourceRepository.list(config.model, filter, sort);
  return docs.map((doc) => applyOutputTransform(config, doc));
};

const upsertResource = async (config, idValue, body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const data = { ...body };

  if (config.idField) {
    data[config.idField] = idValue;
  }

  if (!data.ownerId) {
    throw badRequest('ownerId is required');
  }

  if (config.timeField) {
    ensureTimestamp(data, config.timeField);
  }

  if (config.transformInput) {
    config.transformInput(data);
  }

  const filter = { [config.idField]: idValue };
  if (data.ownerId) {
    filter.ownerId = data.ownerId;
  }

  const doc = await resourceRepository.upsert(config.model, filter, data);
  return applyOutputTransform(config, doc);
};

const deleteResource = async (config, idValue, ownerId) => {
  const filter = { [config.idField]: idValue };
  if (ownerId) {
    filter.ownerId = ownerId;
  }

  if (config.supportsDeleted) {
    const update = { [config.deletedField || 'is_deleted']: true };
    if (config.timeField) {
      update[config.timeField] = Date.now();
    }

    const doc = await resourceRepository.update(config.model, filter, update);
    if (!doc) {
      throw notFound('Resource not found');
    }
    return doc;
  }

  const removed = await resourceRepository.remove(config.model, filter);
  if (!removed) {
    throw notFound('Resource not found');
  }
  return removed;
};

module.exports = {
  listResources,
  upsertResource,
  deleteResource
};
