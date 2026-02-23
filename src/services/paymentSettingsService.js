const paymentSettingsRepository = require('../repositories/paymentSettingsRepository');
const { badRequest } = require('../utils/errors');
const { ensureTimestamp } = require('../utils/validation');

const DEFAULT_COMPANY_NAME = '';

const getPaymentSettings = async () => {
  const settings = await paymentSettingsRepository.getSettings();
  if (!settings) {
    return {
      companyName: DEFAULT_COMPANY_NAME
    };
  }
  const payload = typeof settings.toJSON === 'function' ? settings.toJSON() : { ...settings };
  if (payload.companyName === undefined || payload.companyName === null) {
    payload.companyName = DEFAULT_COMPANY_NAME;
  }
  return payload;
};

const upsertPaymentSettings = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const data = { ...body };
  if (data.updatedAt !== undefined) {
    ensureTimestamp(data, 'updatedAt');
  }
  return paymentSettingsRepository.upsertSettings(data);
};

module.exports = {
  getPaymentSettings,
  upsertPaymentSettings
};
