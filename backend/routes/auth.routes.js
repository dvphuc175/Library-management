const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

// API: POST /api/auth/register
router.post('/register', authController.register);

// API: POST /api/auth/login
router.post('/login', authController.login);
module.exports = router;