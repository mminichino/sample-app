// Login Module
const bcrypt = require('bcryptjs');

module.exports = {
    getLoginPage: (req, res) => {
        let status = 0;
        if (req.body.username !== undefined && req.body.password !== undefined){
            let query = "SELECT username, password FROM accounts WHERE username = '" + req.body.username + "'";
            connection.query(query, (err, result) => {
                if (err) throw(err);
                if (result.length !== 0) {
                    bcrypt.compare(req.body.password, result[0].password, function (err, check) {
                        if (check === true) {
                            req.session.user = req.body.username;
                            res.redirect('/');
                        } else {
                            status = 1;
                            res.render('login.ejs', {
                                title: "Login",
                                failure: status
                            });
                        }
                    });
                }
            });
        } else {
            res.render('login.ejs', {
                title: "Login",
                failure: status
            });
        }
    },
};