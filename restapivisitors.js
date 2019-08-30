// REST API Visitor Count

module.exports = {
    getRESTAPIVisitors: (req, res) => {
        let countQuery = "SELECT count(*) as total FROM visits";
        var id = 1;
        var jsonpost = 0;
        let source = req.headers['user-agent'],
            ua = useragent.parse(source);

        if (req.body.method !== undefined){
            console.log("REST call - Agent: " + ua.browser + " Version: " + ua.version + " URL: " + req.url);
            jsonpost = 1;
        }

        // execute query
        connection.query(countQuery, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            res.json({
                id: id,
                result: result[0].total
            });
        });
    },
};