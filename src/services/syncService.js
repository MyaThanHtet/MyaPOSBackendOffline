const { entityConfigs, syncEntities } = require('../config/entities');
const resourceRepository = require('../repositories/resourceRepository');
const { badRequest } = require('../utils/errors');
const { parseBoolean, parseNumber } = require('../utils/validation');

const applyOutputTransform = (config, doc) => {
  if (!config.transformOutput) {
    return doc;
  }
  return config.transformOutput(doc);
};

const buildFilterForEntity = (config, ownerId, updatedSince, includeDeleted) => {
  const filter = { ownerId };
  if (updatedSince !== undefined && config.timeField) {
    filter[config.timeField] = { $gt: updatedSince };
  }
  if (config.supportsDeleted && includeDeleted !== true) {
    filter[config.deletedField || 'is_deleted'] = { $ne: true };
  }
  return filter;
};

const bootstrap = async (ownerId) => {
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }
  const changes = {};
  for (const entity of syncEntities) {
    const config = entityConfigs[entity];
    if (!config) continue;
    const docs = await resourceRepository.list(config.model, { ownerId }, config.timeField ? { [config.timeField]: 1 } : undefined);
    changes[entity] = docs.map((doc) => applyOutputTransform(config, doc));
  }
  return { changes };
};

const pull = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const { ownerId, since, include_deleted } = body;
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }
  const includeDeleted = parseBoolean(include_deleted);

  const changes = {};
  for (const entity of syncEntities) {
    const config = entityConfigs[entity];
    if (!config) continue;
    const sinceValue = since && since[entity] !== undefined ? parseNumber(since[entity]) : undefined;
    if (since && since[entity] !== undefined && sinceValue === undefined) {
      throw badRequest(`since.${entity} must be a number`);
    }
    const filter = buildFilterForEntity(config, ownerId, sinceValue, includeDeleted);
    const docs = await resourceRepository.list(config.model, filter, config.timeField ? { [config.timeField]: 1 } : undefined);
    changes[entity] = docs.map((doc) => applyOutputTransform(config, doc));
  }
  return { server_time: Date.now(), changes };
};

const pullSingle = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const { ownerId, entity, updated_since, include_deleted } = body;
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }
  if (!entity) {
    throw badRequest('entity is required');
  }
  const config = entityConfigs[entity];
  if (!config) {
    throw badRequest('Unknown entity');
  }
  const updatedSince = updated_since !== undefined ? parseNumber(updated_since) : undefined;
  if (updated_since !== undefined && updatedSince === undefined) {
    throw badRequest('updated_since must be a number');
  }
  const includeDeleted = parseBoolean(include_deleted);
  const filter = buildFilterForEntity(config, ownerId, updatedSince, includeDeleted);
  const docs = await resourceRepository.list(config.model, filter, config.timeField ? { [config.timeField]: 1 } : undefined);
  return { changes: docs.map((doc) => applyOutputTransform(config, doc)) };
};

const applyEntry = async (entry, ownerId) => {
  if (!entry || typeof entry !== 'object') {
    return { rejected: { id: entry?.id, reason: 'Invalid entry' } };
  }

  const { id, entity, entity_id, type, payload } = entry;
  if (!id || !entity || !entity_id || !type) {
    return { rejected: { id: id || null, reason: 'Missing required fields' } };
  }

  const config = entityConfigs[entity];
  if (!config) {
    return { rejected: { id, reason: 'Unknown entity' } };
  }

  if (type !== 'upsert' && type !== 'delete') {
    return { rejected: { id, reason: 'Invalid type' } };
  }

  if (type === 'delete') {
    const filter = { [config.idField]: entity_id };
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
        return { rejected: { id, reason: 'Not found' } };
      }
      const updatedAt = config.timeField ? doc[config.timeField] : Date.now();
      return { applied: { id, entity, entity_id, updated_at: updatedAt } };
    }

    const removed = await resourceRepository.remove(config.model, filter);
    if (!removed) {
      return { rejected: { id, reason: 'Not found' } };
    }
    return { applied: { id, entity, entity_id, updated_at: Date.now() } };
  }

  const data = { ...(payload || {}) };
  data[config.idField] = entity_id;
  if (ownerId) {
    data.ownerId = ownerId;
  } else {
    data.ownerId = data.ownerId || ownerId;
  }

  if (!data.ownerId) {
    return { rejected: { id, reason: 'ownerId is required' } };
  }

  if (config.timeField && data[config.timeField] === undefined) {
    return { rejected: { id, reason: `${config.timeField} is required` } };
  }

  if (config.transformInput) {
    config.transformInput(data);
  }

  const filter = { [config.idField]: entity_id, ownerId: data.ownerId };
  const doc = await resourceRepository.upsert(config.model, filter, data);
  const updatedAt = config.timeField ? doc[config.timeField] : Date.now();
  return { applied: { id, entity, entity_id, updated_at: updatedAt } };
};

const push = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const { ownerId, entries } = body;
  if (!ownerId) {
    throw badRequest('ownerId is required');
  }
  if (!Array.isArray(entries)) {
    throw badRequest('entries must be an array');
  }

  const applied = [];
  const rejected = [];

  for (const entry of entries) {
    try {
      const result = await applyEntry(entry, ownerId);
      if (result.applied) {
        applied.push(result.applied);
      } else if (result.rejected) {
        rejected.push(result.rejected);
      }
    } catch (err) {
      rejected.push({ id: entry?.id || null, reason: err.message || 'Failed to apply entry' });
    }
  }

  return { applied, rejected };
};

module.exports = {
  bootstrap,
  pull,
  pullSingle,
  push
};
