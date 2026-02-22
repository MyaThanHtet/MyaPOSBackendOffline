const { badRequest } = require('./errors');

const parseNumber = (value) => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value.toLowerCase() === 'true' || value === '1') return true;
    if (value.toLowerCase() === 'false' || value === '0') return false;
  }
  return undefined;
};

const requireBody = (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
};

const requireField = (body, field) => {
  if (body[field] === undefined || body[field] === null || body[field] === '') {
    throw badRequest(`${field} is required`);
  }
};

const requireNumberField = (body, field) => {
  requireField(body, field);
  const num = parseNumber(body[field]);
  if (num === undefined) {
    throw badRequest(`${field} must be a number`);
  }
  body[field] = num;
};

const ensureIdMatch = (paramValue, bodyValue, fieldName) => {
  if (bodyValue !== undefined && String(bodyValue) !== String(paramValue)) {
    throw badRequest(`${fieldName} must match path parameter`);
  }
};

const ensureTimestamp = (body, field) => {
  if (body[field] === undefined) {
    throw badRequest(`${field} is required`);
  }
  const num = parseNumber(body[field]);
  if (num === undefined) {
    throw badRequest(`${field} must be a number`);
  }
  body[field] = num;
};

module.exports = {
  parseNumber,
  parseBoolean,
  requireBody,
  requireField,
  requireNumberField,
  ensureIdMatch,
  ensureTimestamp
};
