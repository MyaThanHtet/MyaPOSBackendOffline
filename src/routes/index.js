const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');
const staffRoutes = require('./staffRoutes');
const syncRoutes = require('./syncRoutes');
const tableRoutes = require('./tableRoutes');
const expenseRoutes = require('./expenseRoutes');
const { createResourceRouter } = require('./resourceRoutes');
const { authenticate } = require('../middleware/auth');
const { entityConfigs } = require('../config/entities');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/staff-users', staffRoutes);
router.use('/sync', syncRoutes);
router.use('/expenses', expenseRoutes);

// Resource endpoints
Object.values(entityConfigs).forEach((config) => {
  if (!config.path) {
    return;
  }
  router.use(config.path, createResourceRouter(config, authenticate));
});

// Table-specific action
router.use('/tables', tableRoutes);

module.exports = router;
