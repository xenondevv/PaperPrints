const { firebaseLogin, refreshTokens } = require('./auth.service');

async function handleFirebaseLogin(req, res, next) {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ message: 'idToken is required' });
    }
    const data = await firebaseLogin(idToken);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function handleRefresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }
    const data = await refreshTokens(refreshToken);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { handleFirebaseLogin, handleRefresh };
