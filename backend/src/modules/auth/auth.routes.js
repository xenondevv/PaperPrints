const { Router } = require('express');
const { handleFirebaseLogin, handleRefresh } = require('./auth.controller');

const router = Router();

// POST /auth/firebase  — exchange Firebase ID token for our JWT pair
router.post('/firebase', handleFirebaseLogin);

// POST /auth/refresh   — rotate access token
router.post('/refresh', handleRefresh);

module.exports = router;
