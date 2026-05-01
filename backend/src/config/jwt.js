const jwt = require('jsonwebtoken');
const env = require('./env');

const signAccessToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

const signRefreshToken = (payload) =>
  jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: '30d' });

const verifyAccessToken = (token) =>
  jwt.verify(token, env.jwt.secret);

const verifyRefreshToken = (token) =>
  jwt.verify(token, env.jwt.refreshSecret);

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken };
