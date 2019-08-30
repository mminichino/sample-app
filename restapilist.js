// REST API Visitor List

module.exports = {
    getRESTAPIList: (req, res) => {
        let listQuery = "SELECT * FROM visitdata ORDER BY id ASC";
        let resultjson = {};
        let resultlist = [];
        let id = 1;
        let jsonpost = 0;
        let sortorder = 0;  // 0 ascending 1 descending
        let start = 0;
        let end = 0;
        let source = req.headers['user-agent'],
            ua = useragent.parse(source);

        if (req.body.method !== undefined){
            console.log("REST call - Agent: " + ua.browser + " Version: " + ua.version + " URL: " + req.url);
            jsonpost = 1;
            if (req.body.order !== undefined && req.body.order === 'descending') {
                sortorder = 1;
            }
            if (req.body.between !== undefined){
                let betweendata = req.body.between.split('-',2);
                if(betweendata[0] !== undefined && betweendata[0]>0) start = parseInt(betweendata[0],10);
                if(betweendata[1] !== undefined && betweendata[1]>0) end = parseInt(betweendata[1],10);
            }
        }

        if (sortorder === 1) {
            listQuery = "SELECT * FROM visitdata ORDER BY id DESC";
        }

        resultjson.id = id;

        // execute query
        connection.query(listQuery, (err, result) => {
            if (err) {
                res.redirect('/');
            }
            Object.keys(result).forEach(function(key) {
                if (start > 0) {
                    if(result[key].id < start) return;
                }
                if (end > 0) {
                    if(result[key].id > end) return;
                }
                resultlist.push({
                    id: result[key].id,
                    visitornum: result[key].vnum,
                    remoteip: result[key].requestip,
                    browser: result[key].browsertype,
                    browserversion: result[key].browservers,
                    devicetype: result[key].devtype,
                    osname: result[key].ostype,
                    kpodname: result[key].podname,
                    date: result[key].visitdate
                });
            });
            resultjson.results = resultlist;
            res.json(resultjson);
        });
    },
};