const authService = require('../services/authService');

const signup = async (req, res, next) => {
  try {
    const result = await authService.signup(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const createStaff = async (req, res, next) => {
  try {
    const result = await authService.createStaff(req.user, req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  signup,
  login,
  createStaff
};
