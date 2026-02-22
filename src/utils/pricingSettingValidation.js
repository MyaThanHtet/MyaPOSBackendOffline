const { badRequest } = require('./errors');
const { parseBoolean, parseNumber } = require('./validation');

const DEFAULT_PRICING_TABLE_SERVICE = {
  table_service_charge_enabled: false,
  table_service_rate_per_hour: 0,
  table_service_grace_period_minutes: 0,
  table_service_minimum_charge: 0
};

const normalizeBooleanLike = (value, field) => {
  if (typeof value === 'number') {
    if (value === 1) {
      return true;
    }
    if (value === 0) {
      return false;
    }
  }
  const parsed = parseBoolean(value);
  if (parsed === undefined) {
    throw badRequest(`${field} must be a boolean or 0/1`);
  }
  return parsed;
};

const normalizeNonNegativeNumber = (value, field) => {
  const parsed = parseNumber(value);
  if (parsed === undefined) {
    throw badRequest(`${field} must be a number`);
  }
  if (parsed < 0) {
    throw badRequest(`${field} must be greater than or equal to 0`);
  }
  return parsed;
};

const normalizeNonNegativeInteger = (value, field) => {
  const parsed = normalizeNonNegativeNumber(value, field);
  if (!Number.isInteger(parsed)) {
    throw badRequest(`${field} must be an integer`);
  }
  return parsed;
};

const normalizePricingSettingInput = (data) => {
  if (Object.prototype.hasOwnProperty.call(data, 'table_service_charge_enabled')) {
    data.table_service_charge_enabled = normalizeBooleanLike(
      data.table_service_charge_enabled,
      'table_service_charge_enabled'
    );
  }

  if (Object.prototype.hasOwnProperty.call(data, 'table_service_rate_per_hour')) {
    data.table_service_rate_per_hour = normalizeNonNegativeNumber(
      data.table_service_rate_per_hour,
      'table_service_rate_per_hour'
    );
  }

  if (Object.prototype.hasOwnProperty.call(data, 'table_service_grace_period_minutes')) {
    data.table_service_grace_period_minutes = normalizeNonNegativeInteger(
      data.table_service_grace_period_minutes,
      'table_service_grace_period_minutes'
    );
  }

  if (Object.prototype.hasOwnProperty.call(data, 'table_service_minimum_charge')) {
    data.table_service_minimum_charge = normalizeNonNegativeNumber(
      data.table_service_minimum_charge,
      'table_service_minimum_charge'
    );
  }

  return data;
};

const withPricingSettingDefaults = (doc) => {
  if (!doc || typeof doc !== 'object') {
    return doc;
  }

  const plain = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    ...plain,
    table_service_charge_enabled:
      plain.table_service_charge_enabled !== undefined
        ? plain.table_service_charge_enabled
        : DEFAULT_PRICING_TABLE_SERVICE.table_service_charge_enabled,
    table_service_rate_per_hour:
      plain.table_service_rate_per_hour !== undefined
        ? plain.table_service_rate_per_hour
        : DEFAULT_PRICING_TABLE_SERVICE.table_service_rate_per_hour,
    table_service_grace_period_minutes:
      plain.table_service_grace_period_minutes !== undefined
        ? plain.table_service_grace_period_minutes
        : DEFAULT_PRICING_TABLE_SERVICE.table_service_grace_period_minutes,
    table_service_minimum_charge:
      plain.table_service_minimum_charge !== undefined
        ? plain.table_service_minimum_charge
        : DEFAULT_PRICING_TABLE_SERVICE.table_service_minimum_charge
  };
};

module.exports = {
  DEFAULT_PRICING_TABLE_SERVICE,
  normalizePricingSettingInput,
  withPricingSettingDefaults
};
