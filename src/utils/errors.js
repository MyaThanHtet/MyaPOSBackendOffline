class ApiError extends Error {
  constructor(code, message, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const badRequest = (message, code = 'BAD_REQUEST') => new ApiError(code, message, 400);
const unauthorized = (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
  new ApiError(code, message, 401);
const forbidden = (message = 'Forbidden', code = 'FORBIDDEN') => new ApiError(code, message, 403);
const notFound = (message = 'Not Found', code = 'NOT_FOUND') => new ApiError(code, message, 404);

module.exports = {
  ApiError,
  badRequest,
  unauthorized,
  forbidden,
  notFound
};
