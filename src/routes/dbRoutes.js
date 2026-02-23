const express = require('express');
const dbController = require('../controllers/dbController');

const router = express.Router();

router.post('/raw-query', dbController.rawQuery);
router.post('/raw-update', dbController.rawUpdate);
router.post('/raw-delete', dbController.rawDelete);
router.post('/execute', dbController.execute);

router.get('/:table', dbController.listRows);
router.post('/:table', dbController.insertRow);
router.put('/:table', dbController.updateRows);
router.delete('/:table', dbController.deleteRows);

module.exports = router;
