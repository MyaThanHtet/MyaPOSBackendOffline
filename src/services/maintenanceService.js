const { MANAGED_TABLES, run, get } = require('../config/db');
const { entityConfigs } = require('../config/entities');
const { badRequest } = require('../utils/errors');

const shouldSkipTable = (tableName) => tableName === 'auth_users';

const clearAllData = async () => {
  const cleared = [];
  const skipped = [];

  for (const tableName of MANAGED_TABLES) {
    if (shouldSkipTable(tableName)) {
      skipped.push(tableName);
      continue;
    }
    const countRow = await get(`SELECT COUNT(*) AS total FROM "${tableName}"`);
    await run(`DELETE FROM "${tableName}"`);
    cleared.push({ table: tableName, deletedCount: Number(countRow?.total || 0) });
  }

  cleared.sort((a, b) => a.table.localeCompare(b.table));
  skipped.sort();

  return { cleared, skipped };
};

const clearOwnerData = async (ownerId) => {
  const trimmed = ownerId ? String(ownerId).trim() : '';
  if (!trimmed) {
    throw badRequest('ownerId is required');
  }

  const seen = new Set();
  const cleared = [];

  for (const config of Object.values(entityConfigs)) {
    const tableName = config?.model?.tableName;
    if (!tableName || seen.has(tableName)) {
      continue;
    }
    seen.add(tableName);
    const countRow = await get(`SELECT COUNT(*) AS total FROM "${tableName}" WHERE ownerId = ?`, [trimmed]);
    await run(`DELETE FROM "${tableName}" WHERE ownerId = ?`, [trimmed]);
    cleared.push({
      entity: config.entity,
      table: tableName,
      deletedCount: Number(countRow?.total || 0)
    });
  }

  cleared.sort((a, b) => a.entity.localeCompare(b.entity));

  return { ownerId: trimmed, cleared };
};

module.exports = {
  clearAllData,
  clearOwnerData
};
