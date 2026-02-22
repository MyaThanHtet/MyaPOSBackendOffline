const express = require('express');
const { authenticate } = require('../middleware/auth');
const tableController = require('../controllers/tableController');

const router = express.Router();

router.post('/move', authenticate, tableController.moveTable);

module.exports = router;
