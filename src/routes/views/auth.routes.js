const express = require('express');
const router = express.Router();
const { logoutUser, getSignupPage } = require('../../controllers/authController');

router.get('/login', (req, res) => {
    if (req.cookies.token) return res.redirect('/complaints');
    res.render('login', { title: 'Sign In' });
});
router.get('/logout', logoutUser);
router.get('/signup', getSignupPage);

module.exports = router;