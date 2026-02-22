const test = require('node:test');
const assert = require('node:assert/strict');

const paymentSettingsService = require('../../src/services/paymentSettingsService');
const paymentSettingsRepository = require('../../src/repositories/paymentSettingsRepository');

const originalRepository = {
  getSettings: paymentSettingsRepository.getSettings,
  upsertSettings: paymentSettingsRepository.upsertSettings
};

test.afterEach(() => {
  paymentSettingsRepository.getSettings = originalRepository.getSettings;
  paymentSettingsRepository.upsertSettings = originalRepository.upsertSettings;
});

test('getPaymentSettings returns fallback companyName for legacy records', async () => {
  paymentSettingsRepository.getSettings = async () => ({
    kpayPhone: '+959000000',
    viberNumber: '+959000000'
  });

  const settings = await paymentSettingsService.getPaymentSettings();

  assert.equal(settings.companyName, '');
  assert.equal(settings.kpayPhone, '+959000000');
});

test('getPaymentSettings keeps persisted companyName', async () => {
  paymentSettingsRepository.getSettings = async () => ({
    toJSON: () => ({
      companyName: 'Acme Co',
      telegramUsername: 'acme'
    })
  });

  const settings = await paymentSettingsService.getPaymentSettings();

  assert.equal(settings.companyName, 'Acme Co');
  assert.equal(settings.telegramUsername, 'acme');
});

test('upsertPaymentSettings accepts and forwards companyName', async () => {
  let persistedData = null;
  paymentSettingsRepository.upsertSettings = async (data) => {
    persistedData = data;
    return data;
  };

  const settings = await paymentSettingsService.upsertPaymentSettings({
    companyName: 'Acme Co',
    updatedAt: '1710000000000'
  });

  assert.equal(persistedData.companyName, 'Acme Co');
  assert.equal(persistedData.updatedAt, 1710000000000);
  assert.equal(settings.companyName, 'Acme Co');
});
