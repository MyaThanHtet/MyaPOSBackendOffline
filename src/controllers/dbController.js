const dbAdapterService = require('../services/dbAdapterService');

const listRows = async (req, res, next) => {
  try {
    const rows = await dbAdapterService.queryTable(req.params.table, req.query);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const insertRow = async (req, res, next) => {
  try {
    const result = await dbAdapterService.insertIntoTable(req.params.table, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updateRows = async (req, res, next) => {
  try {
    const result = await dbAdapterService.updateTable(req.params.table, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const deleteRows = async (req, res, next) => {
  try {
    const result = await dbAdapterService.deleteFromTable(req.params.table, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const rawQuery = async (req, res, next) => {
  try {
    const rows = await dbAdapterService.rawQuery(req.body);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const rawUpdate = async (req, res, next) => {
  try {
    const result = await dbAdapterService.rawUpdate(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const rawDelete = async (req, res, next) => {
  try {
    const result = await dbAdapterService.rawDelete(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const execute = async (req, res, next) => {
  try {
    const result = await dbAdapterService.executeStatement(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listRows,
  insertRow,
  updateRows,
  deleteRows,
  rawQuery,
  rawUpdate,
  rawDelete,
  execute
};
