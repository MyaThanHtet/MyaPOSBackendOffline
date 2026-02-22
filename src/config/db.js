const mongoose = require('mongoose');
const { mongoUri } = require('./env');

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  await mongoose.connect(mongoUri, {
    autoIndex: false
  });
};

module.exports = { connectDB };
