const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../../controllers/authController');

router.post('/api/login', loginUser);
router.post('/api/signup', registerUser);

module.exports = router;