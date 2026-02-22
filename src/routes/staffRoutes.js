const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post('/', authenticate, requireRole(['owner', 'manager']), authController.createStaff);

module.exports = router;
