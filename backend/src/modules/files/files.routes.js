'use strict';

const { Router } = require('express');
const { requireAuth }                    = require('../../middleware/auth.middleware');
const { upload }                         = require('../../middleware/upload.middleware');
const { handleUpload, handleDownload }   = require('./files.controller');

const router = Router();

// All file routes require a valid JWT
router.use(requireAuth);

// POST /api/files/upload  — multipart/form-data, field name "file"
router.post('/upload', upload.single('file'), handleUpload);

// GET /api/files/:id/download  — returns a 15-min pre-signed S3 URL
router.get('/:id/download', handleDownload);

module.exports = router;
