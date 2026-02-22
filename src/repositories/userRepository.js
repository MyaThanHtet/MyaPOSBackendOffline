const User = require('../models/User');

const createUser = (data) => User.create(data);
const findUserByEmail = (email) => User.findOne({ email });
const findUserById = (id) => User.findById(id);

module.exports = {
  createUser,
  findUserByEmail,
  findUserById
};
