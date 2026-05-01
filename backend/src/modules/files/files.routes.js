'use strict';

const { Router } = require('express');
const { requireAuth } = require('../../middleware/auth.middleware');
const { upload }      = require('../../middleware/upload.middleware');
const { handleUpload } = require('./files.controller');

const router = Router();
router.use(requireAuth);

// POST /api/files/upload  — multipart/form-data, field name "file"
router.post('/upload', upload.single('file'), handleUpload);

module.exports = router;
