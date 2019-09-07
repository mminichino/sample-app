// Auth Module
const jwt = require('jsonwebtoken');
const config = require('./config');
const bcrypt = require('bcryptjs');

module.exports = {
    getToken: (req, res) => {
        let timestamp = Date.now();
        if (req.body.username && req.body.password) {
            let query = "SELECT username, password FROM accounts WHERE username = '" + req.body.username + "'";
            connection.query(query, (err, result) => {
                if (err) throw(err);
                    if (result.length !== 0) {
                        bcrypt.compare(req.body.password, result[0].password, function (err, check) {
                            if (check === true) {
                                let token = jwt.sign({username: req.body.username},
                                    config.jwtSecret,
                                    {expiresIn: '24h'}
                                );
                                res.json({
                                    responseTime: timestamp,
                                    status: "success",
                                    token: token
                                });
                            } else {
                                res.json({
                                    responseTime: timestamp,
                                    status: "failure",
                                    message: {
                                        text: "Credentials invalid"
                                    }
                                });
                            }
                        });
                    } else {
                        res.json({
                            responseTime: timestamp,
                            status: "failure",
                            message: {
                                text: "Credentials invalid"
                            }
                        });
                    }
            });
        } else {
            res.json({
                status: "failure",
                message: {
                    text: "Invalid Parameters"
                }
            });
        }
    },
    checkToken: (req, res, next) => {
        let token = (req.body && req.body.token) || (req.query && req.query.token) || req.headers['x-access-token'] || req.headers['authorization'];
        let timestamp = Date.now();
        if (token) {
            if (token.startsWith('Bearer ')) {
                token = token.slice(7, token.length);
            }
            jwt.verify(token, config.jwtSecret, (err, decoded) => {
                if (err) {
                    return res.json({
                        responseTime: timestamp,
                        status: "failure",
                        message: {
                            text: "Credentials invalid"
                        }
                    });
                } else {
                    req.decoded = decoded;
                    next();
                }
            });
        } else {
            return res.json({
                responseTime: timestamp,
                status: "failure",
                message: {
                    text: "Invalid Parameters"
                }
            });
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