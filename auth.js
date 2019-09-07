// Auth Module
const jwt = require('jsonwebtoken');
const config = require('./config');

module.exports = {
    checkToken: (req, res, next) => {
        let token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'] || req.headers['authorization'];
        console.log(req.headers);
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        if (token) {
            jwt.verify(token, config.secret, (err, decoded) => {
                if (err) {
                    return res.json({
                        success: false,
                        message: 'Invalid Token Supplied'
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            next();
        }
    },
    sessionChecker: (req, res, next) => {
        if (req.session.user && req.cookies.user_sid) {
            next();
        } else {
            res.redirect('/login');
        }
    },
    sessionLogout: (req, res) => {
        if (req.session.user && req.cookies.user_sid) {
            res.clearCookie('user_sid');
        }
        res.redirect('/login');
    },
};