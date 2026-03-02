const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateLoginRequest } = require('../middleware/validation');

router.post('/login', validateLoginRequest, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);

module.exports = router;
