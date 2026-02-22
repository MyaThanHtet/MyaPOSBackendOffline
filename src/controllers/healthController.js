const { getHealth } = require('../services/healthService');

const healthCheck = (req, res) => {
  res.json(getHealth());
};

module.exports = { healthCheck };
