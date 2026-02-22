const express = require('express');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, userController.getMe);
router.put('/me', authenticate, userController.upsertMe);
router.delete('/clear-data', authenticate, userController.clearMyData);
router.get('/:uid/subscription', authenticate, userController.getSubscription);

module.exports = router;
