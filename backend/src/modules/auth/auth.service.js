const admin = require('../../config/firebase');
const { query } = require('../../config/db');
const { signAccessToken, signRefreshToken } = require('../../config/jwt');

/**
 * POST /auth/firebase
 * Verify a Firebase ID token, upsert the user, return our JWT pair.
 */
async function firebaseLogin(idToken) {
  // 1. Verify token with Firebase Admin
  let decoded;
  try {
    decoded = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    const error = new Error('Invalid Firebase token');
    error.status = 401;
    throw error;
  }

  const { uid, email, name, picture } = decoded;

  if (!email) {
    const error = new Error('Google account must have an email address');
    error.status = 400;
    throw error;
  }

  // 2. Upsert user — find by firebase_uid, fallback to email
  let result = await query(
    `SELECT u.*, v.shop_name 
     FROM users u 
     LEFT JOIN vendors v ON v.user_id = u.id 
     WHERE u.firebase_uid = $1 LIMIT 1`,
    [uid]
  );

  let user = result.rows[0];

  if (!user) {
    // Try by email (handles existing accounts before Firebase migration)
    result = await query(
      `SELECT u.*, v.shop_name 
       FROM users u 
       LEFT JOIN vendors v ON v.user_id = u.id 
       WHERE u.email = $1 LIMIT 1`,
      [email]
    );
    user = result.rows[0];

    if (user) {
      // Link firebase_uid to existing email account
      await query(
        `UPDATE users SET firebase_uid = $1, photo_url = COALESCE($2, photo_url) WHERE id = $3`,
        [uid, picture || null, user.id]
      );
      user.firebase_uid = uid;
    }
  }

  if (!user) {
    // New user — create account from Google profile
    result = await query(
      `INSERT INTO users (name, email, firebase_uid, photo_url, role)
       VALUES ($1, $2, $3, $4, 'user')
       RETURNING *`,
      [name || email.split('@')[0], email, uid, picture || null]
    );
    user = result.rows[0];
  }

  // 3. Issue our own JWT pair
  const payload = { id: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photo_url || null,
      role: user.role,
      shopName: user.shop_name || null,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * POST /auth/refresh
 * Rotate an access token using a valid refresh token.
 */
async function refreshTokens(refreshToken) {
  const jwt = require('jsonwebtoken');
  const env = require('../../config/env');

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    const error = new Error('Invalid refresh token');
    error.status = 401;
    throw error;
  }

  // Always fetch the latest role from DB (handles role upgrades like user → vendor)
  const userRes = await query(`
    SELECT u.role, u.name, u.email, u.photo_url, v.shop_name 
    FROM users u
    LEFT JOIN vendors v ON v.user_id = u.id
    WHERE u.id = $1
  `, [decoded.id]);
  
  if (!userRes.rows[0]) {
    const error = new Error('User not found');
    error.status = 401;
    throw error;
  }
  const currentUser = userRes.rows[0];

  const { signAccessToken: sign } = require('../../config/jwt');
  const newAccess = sign({ id: decoded.id, role: currentUser.role });
  return {
    accessToken: newAccess,
    user: {
      id: decoded.id,
      name: currentUser.name,
      email: currentUser.email,
      photoUrl: currentUser.photo_url || null,
      role: currentUser.role,
      shopName: currentUser.shop_name || null,
    },
  };
}

module.exports = { firebaseLogin, refreshTokens };
