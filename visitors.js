// Visitors Page

module.exports = {
    getVisitors: (req, res) => {
        var countQuery = "SELECT count(*) as total FROM visitdata";
        var perPage = 10;
        var page = req.params.page || 1;
        var tableCount = 0;
        if (req.session.user && req.cookies.user_sid){
            var authenticated = 1;
        } else {
            var authenticated = 0;
        }

        // get row count
        connection.query(countQuery, (err, countResult) => {
            if (err) {
                res.redirect('/');
            }

        tableCount = countResult[0].total;

        var startRow = tableCount - (perPage * (page - 1));
        if ((startRow - perPage) > 0) {
            var endRow = (startRow - perPage) + 1;
        } else {
            var endRow = 1;
        }

        var query = "SELECT * FROM visitdata WHERE id BETWEEN " + endRow + " AND " + startRow + " ORDER BY id DESC"; // query database

        // execute primary query
        connection.query(query, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            res.render('visitors.ejs', {
                title: "Visitors",
                authstatus: authenticated,
                current: page,
                pages: Math.ceil(tableCount/perPage),
                start: startRow,
                end: endRow,
                visitors: result
            });
        });
        });
    },
};