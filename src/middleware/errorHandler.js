const { ApiError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  const isApiError = err instanceof ApiError;
  const status = err.status || (isApiError ? err.status : 500) || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  const message = err.message || 'Internal Server Error';

  if (status >= 500) {
    console.error(err);
  }

  res.status(status).json({
    error: {
      code,
      message
    }
  });
};

module.exports = { errorHandler };
