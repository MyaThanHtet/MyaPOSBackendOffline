const { badRequest, forbidden } = require('./errors');

const normalizeScope = (value) => {
  if (value === undefined || value === null) {
    return undefined;
  }
  const trimmed = String(value).trim();
  return trimmed || undefined;
};

const resolveOwnerScope = ({ user, requestedOwnerId }) => {
  const tokenOwnerId = normalizeScope(user?.ownerId);
  const scopeOwnerId = normalizeScope(requestedOwnerId);
  const isSuperAdmin = user?.role === 'super_admin';

  if (isSuperAdmin) {
    if (scopeOwnerId) {
      return scopeOwnerId;
    }
    if (tokenOwnerId) {
      return tokenOwnerId;
    }
    throw badRequest('ownerId is required');
  }

  if (!tokenOwnerId) {
    throw forbidden('ownerId is missing in token');
  }
  if (scopeOwnerId && scopeOwnerId !== tokenOwnerId) {
    throw forbidden('ownerId does not match token');
  }
  return tokenOwnerId;
};

module.exports = {
  resolveOwnerScope
};
