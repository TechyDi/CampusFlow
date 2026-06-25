const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_for_local_dev';

function authenticateToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) return res.redirect('/login');

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.redirect('/login');
        req.user = user;
        res.locals.user = user; 
        next();
    });
}

function checkUserContext(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        res.locals.user = null;
        return next();
    }
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            req.user = user;
            res.locals.user = user;
        } else {
            res.locals.user = null;
        }
        next();
    });
}

module.exports = { authenticateToken, checkUserContext };
