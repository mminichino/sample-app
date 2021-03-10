// Health Check Page

module.exports = {
    getHealthCheckPage: (req, res) => {
        let query = "SELECT count(*) as total FROM visitdata"; // query database
        let sessionKeys = 0;
        let visitorCount = 0;

        // execute query
        connection.query(query, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            visitorCount = result[0].total;
            // check redis
            redisClient.keys("sess:*", (err, result) => {
                if (err) {
                    res.redirect('/');
                }
                sessionKeys = result.length;
                res.render('healthz.ejs', {
                    title: "NetApp Kubernetes Demo",
                    version: appversion,
                    keycount: sessionKeys,
                    visitcount: visitorCount
                });
            });
        });
    },
};
