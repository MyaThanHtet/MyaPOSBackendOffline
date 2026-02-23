const userProfileRepository = require('../repositories/userProfileRepository');
const subscriptionRepository = require('../repositories/subscriptionRepository');
const authRepository = require('../repositories/authRepository');
const { badRequest, notFound } = require('../utils/errors');
const { ensureTimestamp, parseNumber } = require('../utils/validation');

const mergeProfileFromAuth = (profile, authUser) => {
  if (!authUser) {
    return { ...profile };
  }

  const merged = { ...profile };
  if (!merged.email && authUser.email) {
    merged.email = authUser.email;
  }
  if (!merged.emailLower && authUser.emailLower) {
    merged.emailLower = authUser.emailLower;
  }
  if (!merged.ownerId && authUser.ownerId) {
    merged.ownerId = authUser.ownerId;
  }
  if (!merged.role && authUser.role) {
    merged.role = authUser.role;
  }
  if (merged.ownerEmail === undefined || merged.ownerEmail === null) {
    const role = merged.role || authUser.role;
    if (role === 'owner' && merged.email) {
      merged.ownerEmail = merged.email;
    }
  }
  if (merged.isSuperAdmin === undefined || merged.isSuperAdmin === null) {
    const role = merged.role || authUser.role;
    merged.isSuperAdmin = role === 'super_admin';
  }
  if (!merged.updatedAt) {
    merged.updatedAt = Date.now();
  }

  return merged;
};

const getCurrentUser = async (uid) => {
  let profile = await userProfileRepository.findByUid(uid);
  if (!profile) {
    const authUser = await authRepository.findByUid(uid);
    if (!authUser) {
      throw notFound('User profile not found');
    }
    profile = await userProfileRepository.upsertByUid(uid, {
      uid,
      email: authUser.email,
      emailLower: authUser.emailLower,
      ownerId: authUser.ownerId,
      role: authUser.role,
      isSuperAdmin: authUser.role === 'super_admin',
      updatedAt: Date.now()
    });
  }

  const authUser = await authRepository.findByUid(uid);
  const merged = mergeProfileFromAuth(profile, authUser);
  const changed = Object.keys(merged).some((key) => merged[key] !== profile[key]);
  if (changed) {
    profile = await userProfileRepository.upsertByUid(uid, merged);
  }

  return profile;
};

const upsertCurrentUser = async (uid, body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const data = { ...body, uid };
  if (data.updatedAt !== undefined) {
    ensureTimestamp(data, 'updatedAt');
  }

  const current = await userProfileRepository.findByUid(uid);
  const authUser = await authRepository.findByUid(uid);
  const mergedCurrent = mergeProfileFromAuth(current || {}, authUser);
  const finalData = {
    ...mergedCurrent,
    ...data,
    uid
  };
  if ((finalData.ownerEmail === undefined || finalData.ownerEmail === null) && finalData.role === 'owner') {
    finalData.ownerEmail = finalData.email;
  }

  return userProfileRepository.upsertByUid(uid, finalData);
};

const getSubscription = async (uid) => {
  const subscription = await subscriptionRepository.findByUid(uid);
  if (!subscription) {
    return subscriptionRepository.upsertByUid(uid, {
      uid,
      isPremium: false,
      expiryDate: null,
      planName: 'Free',
      updatedAt: Date.now()
    });
  }
  return subscription;
};

const upsertSubscription = async (uid, body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const data = { ...body, uid };
  if (data.updatedAt !== undefined) {
    ensureTimestamp(data, 'updatedAt');
  }
  return subscriptionRepository.upsertByUid(uid, data);
};

const listUsersByOwnerEmail = async (ownerEmail, page, limit) => {
  const pagination = normalizePagination(page, limit) || { page: 1, limit: 50, skip: 0 };
  if (!ownerEmail) {
    const [items, total] = await userProfileRepository.findAllPaged(pagination.skip, pagination.limit);
    return buildPaginatedResult(items, total, pagination);
  }
  const [items, total] = await userProfileRepository.findByOwnerEmailPaged(ownerEmail, pagination.skip, pagination.limit);
  return buildPaginatedResult(items, total, pagination);
};

const searchUsers = async (query, page, limit) => {
  const trimmed = query !== undefined && query !== null ? String(query).trim() : '';
  if (!trimmed) {
    throw badRequest('query is required');
  }

  const pagination = normalizePagination(page, limit) || { page: 1, limit: 50, skip: 0 };
  if (trimmed.includes('@')) {
    const [items, total] = await userProfileRepository.findByEmailPaged(
      trimmed,
      pagination.skip,
      pagination.limit
    );
    return buildPaginatedResult(items, total, pagination);
  }

  const [items, total] = await userProfileRepository.findByUidOrOwnerIdPaged(
    trimmed,
    pagination.skip,
    pagination.limit
  );
  return buildPaginatedResult(items, total, pagination);
};

const listAuthEmails = async (query, page, limit) => {
  const trimmed = query !== undefined && query !== null ? String(query).trim() : '';
  const pagination = normalizePagination(page, limit) || { page: 1, limit: 50, skip: 0 };

  const [items, total] = await authRepository.findEmailsPaged(trimmed || undefined, pagination.skip, pagination.limit);
  const emails = items.map((item) => ({ uid: item.uid, email: item.email }));
  return buildPaginatedResult(emails, total, pagination);
};

const normalizePagination = (pageValue, limitValue) => {
  const pageNum = parseNumber(pageValue);
  const limitNum = parseNumber(limitValue);

  if (pageNum === undefined && limitNum === undefined) {
    return null;
  }

  const page = pageNum !== undefined ? pageNum : 1;
  const limit = limitNum !== undefined ? limitNum : 50;

  if (!Number.isInteger(page) || page < 1) {
    throw badRequest('page must be a positive integer');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw badRequest('limit must be between 1 and 200');
  }

  return { page, limit, skip: (page - 1) * limit };
};

const buildPaginatedResult = (items, total, pagination) => ({
  items,
  page: pagination.page,
  limit: pagination.limit,
  total,
  totalPages: Math.ceil(total / pagination.limit)
});

const setUserRole = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const uid = body.uid && String(body.uid).trim();
  const email = body.email && String(body.email).trim();
  const role = body.role && String(body.role).trim();

  if (!role) {
    throw badRequest('role is required');
  }

  const allowedRoles = new Set(['user', 'admin', 'super_admin']);
  if (!allowedRoles.has(role)) {
    throw badRequest('role must be one of: user, admin, super_admin');
  }

  if (!uid && !email) {
    throw badRequest('uid or email is required');
  }

  const updatedAt = Date.now();
  let authUser;
  if (uid) {
    authUser = await authRepository.updateRoleByUid(uid, role, updatedAt);
  } else {
    const emailLower = email.toLowerCase();
    authUser = await authRepository.updateRoleByEmailLower(emailLower, role, updatedAt);
  }

  if (!authUser) {
    throw notFound('Auth user not found');
  }

  const profileUpdate = {
    role,
    isSuperAdmin: role === 'super_admin'
  };
  if (authUser.email) {
    profileUpdate.email = authUser.email;
  }
  if (authUser.emailLower) {
    profileUpdate.emailLower = authUser.emailLower;
  }

  await userProfileRepository.updateByUid(authUser.uid, profileUpdate);

  return { uid: authUser.uid, email: authUser.email, role: authUser.role };
};

const upsertUserByUid = async (uid, body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }
  const data = { ...body, uid };
  if (data.updatedAt !== undefined) {
    ensureTimestamp(data, 'updatedAt');
  }
  return userProfileRepository.upsertByUid(uid, data);
};

module.exports = {
  getCurrentUser,
  upsertCurrentUser,
  getSubscription,
  upsertSubscription,
  listUsersByOwnerEmail,
  searchUsers,
  listAuthEmails,
  setUserRole,
  upsertUserByUid
};
