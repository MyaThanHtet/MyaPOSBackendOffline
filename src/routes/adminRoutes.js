const express = require('express');
const adminController = require('../controllers/adminController');
const { authenticate, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/users', authenticate, requireSuperAdmin, adminController.listUsersByOwnerEmail);
router.get('/users/search', authenticate, requireSuperAdmin, adminController.searchUsers);
router.get('/users/emails', authenticate, requireAdmin, adminController.listAuthEmails);
router.delete('/clear-data', authenticate, requireSuperAdmin, adminController.clearData);
router.put('/users/role', authenticate, requireSuperAdmin, adminController.setUserRole);
router.put('/users/super-admin', authenticate, requireSuperAdmin, adminController.setSuperAdmin);
router.put('/users/:uid', authenticate, requireSuperAdmin, adminController.upsertUserByUid);
router.put('/users/:uid/subscription', authenticate, requireAdmin, adminController.upsertSubscription);

router.get('/payment-settings', authenticate, adminController.getPaymentSettings);
router.put('/payment-settings', authenticate, requireSuperAdmin, adminController.upsertPaymentSettings);

module.exports = router;
