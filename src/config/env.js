const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

const required = ['PORT', 'MONGO_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  // Fail fast with a clear error to prevent misconfigured deployments
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET
};
