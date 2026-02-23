const { get, run } = require('../config/db');

const TABLE = 'payment_settings';

const getSettings = () => get(`SELECT * FROM ${TABLE} WHERE singleton_id = 1 LIMIT 1`);

const upsertSettings = async (data) => {
  await run(
    `INSERT INTO ${TABLE}
      (singleton_id, companyName, kpayPhone, viberNumber, telegramUsername, price1Month, price3Months, price6Months, price12Months, updatedAt)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (singleton_id) DO UPDATE SET
       companyName = excluded.companyName,
       kpayPhone = excluded.kpayPhone,
       viberNumber = excluded.viberNumber,
       telegramUsername = excluded.telegramUsername,
       price1Month = excluded.price1Month,
       price3Months = excluded.price3Months,
       price6Months = excluded.price6Months,
       price12Months = excluded.price12Months,
       updatedAt = excluded.updatedAt`,
    [
      data.companyName ?? '',
      data.kpayPhone ?? null,
      data.viberNumber ?? null,
      data.telegramUsername ?? null,
      data.price1Month ?? null,
      data.price3Months ?? null,
      data.price6Months ?? null,
      data.price12Months ?? null,
      data.updatedAt ?? null
    ]
  );
  return getSettings();
};

module.exports = {
  getSettings,
  upsertSettings
};
