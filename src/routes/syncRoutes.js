const express = require('express');
const syncController = require('../controllers/syncController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/bootstrap', authenticate, syncController.bootstrap);
router.post('/pull', authenticate, syncController.pull);
router.post('/push', authenticate, syncController.push);
router.post('/pull-single', authenticate, syncController.pullSingle);

module.exports = router;
