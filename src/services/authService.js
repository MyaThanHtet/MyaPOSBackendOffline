const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const authRepository = require('../repositories/authRepository');
const userProfileRepository = require('../repositories/userProfileRepository');
const models = require('../models');
const resourceRepository = require('../repositories/resourceRepository');
const { badRequest, unauthorized } = require('../utils/errors');
const { jwtSecret } = require('../config/env');

const createToken = (user) =>
  jwt.sign(
    { uid: user.uid, role: user.role, ownerId: user.ownerId, email: user.email },
    jwtSecret,
    { expiresIn: '30d' }
  );

const createAuthUser = async ({ email, password, role, ownerId }) => {
  const now = Date.now();
  const uid = uuidv4();
  const password_hash = await bcrypt.hash(password, 10);
  const finalOwnerId = ownerId || uid;

  const authUser = await authRepository.createAuthUser({
    uid,
    email,
    emailLower: email.toLowerCase(),
    password_hash,
    role,
    ownerId: finalOwnerId,
    created_at: now,
    updated_at: now
  });

  await userProfileRepository.upsertByUid(uid, {
    uid,
    email,
    emailLower: email.toLowerCase(),
    ownerId: finalOwnerId,
    ownerEmail: role === 'owner' ? email : undefined,
    role,
    isSuperAdmin: false,
    updatedAt: now
  });

  return authUser;
};

const ensureOwnerId = async (user) => {
  if (!user.ownerId) {
    const updated = await authRepository.updateOwnerIdByUid(user.uid, user.uid, Date.now());
    if (updated) {
      user.ownerId = updated.ownerId;
    } else {
      user.ownerId = user.uid;
    }
  }
};

const signup = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const email = body.email && String(body.email).trim();
  const password = body.password && String(body.password);

  if (!email) {
    throw badRequest('email is required');
  }
  if (!password) {
    throw badRequest('password is required');
  }
  if (password.length < 6) {
    throw badRequest('password must be at least 6 characters');
  }

  const emailLower = email.toLowerCase();
  const existing = await authRepository.findByEmailLower(emailLower);

  if (existing) {
    throw badRequest('EMAIL_ALREADY_EXISTS');
  }

  const newUser = await createAuthUser({ email, password, role: 'owner' });
  const token = createToken(newUser);

  return {
    uid: newUser.uid,
    email: newUser.email,
    role: newUser.role,
    ownerId: newUser.ownerId,
    token
  };
};

const login = async (body) => {
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const email = body.email && String(body.email).trim();
  const password = body.password && String(body.password);

  if (!email) {
    throw badRequest('email is required');
  }
  if (!password) {
    throw badRequest('password is required');
  }

  const emailLower = email.toLowerCase();
  const existing = await authRepository.findByEmailLower(emailLower);
  if (!existing) {
    throw unauthorized('USER_NOT_FOUND');
  }

  const matches = await bcrypt.compare(password, existing.password_hash);
  if (!matches) {
    throw unauthorized('INVALID_CREDENTIALS');
  }

  await ensureOwnerId(existing);
  const token = createToken(existing);
  return {
    uid: existing.uid,
    email: existing.email,
    role: existing.role,
    ownerId: existing.ownerId,
    token
  };
};

const createStaff = async (creator, body) => {
  if (!creator || !creator.ownerId) {
    throw unauthorized('Invalid token');
  }
  if (!body || typeof body !== 'object') {
    throw badRequest('Request body is required');
  }

  const email = body.email && String(body.email).trim();
  const password = body.password && String(body.password);
  const role = body.role ? String(body.role).trim() : 'cashier';
  const name = body.name && String(body.name).trim();
  const permissions = body.permissions;

  if (!email) {
    throw badRequest('email is required');
  }
  if (!password) {
    throw badRequest('password is required');
  }
  if (password.length < 6) {
    throw badRequest('password must be at least 6 characters');
  }

  const allowedRoles = new Set(['manager', 'cashier']);
  if (!allowedRoles.has(role)) {
    throw badRequest('role must be one of: manager, cashier');
  }

  const emailLower = email.toLowerCase();
  const existing = await authRepository.findByEmailLower(emailLower);
  if (existing) {
    throw badRequest('email already exists');
  }

  const authUser = await createAuthUser({
    email,
    password,
    role,
    ownerId: creator.ownerId
  });

  if (models?.StaffUser) {
    const now = Date.now();
    const staffId = uuidv4();
    await resourceRepository.upsert(
      models.StaffUser,
      { id: staffId, ownerId: creator.ownerId },
      {
        id: staffId,
        name: name || email,
        email,
        role,
        permissions,
        is_active: true,
        auth_uid: authUser.uid,
        updated_at: now,
        ownerId: creator.ownerId
      }
    );
  }

  return {
    uid: authUser.uid,
    email: authUser.email,
    role: authUser.role,
    ownerId: authUser.ownerId
  };
};

module.exports = {
  signup,
  login,
  createAuthUser,
  createStaff
};
