//Start of stats page statistics
module.exports = function(app, connection) {
    app.get("/api/statistics/apsByDay", (req, res) => {
        console.log("Got: /api/statisics/apsByDay Called");
        if (!req.params.days || !isNaN(req.params.days)) {
            days = 365;
        } else {
            days = req.params.days;
        }

        connection.query("SELECT DATE_FORMAT(time, '%Y-%m-%d') AS day, COUNT(ID) AS reported FROM aps GROUP BY day ORDER BY day DESC LIMIT ?", 
            [days],
            function(err, results, fields) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });

    app.get("/api/statistics/messagesByDay", (req, res) => {
        console.log("Got: /api/statisics/apsByDay Called");
        if (!req.params.days || !isNaN(req.params.days) || req.params.days > 365) {
            days = 365;
        } else {
            days = req.params.days;
        }

        connection.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS messages FROM messages GROUP BY day ORDER BY day DESC LIMIT ?", 
            [days],
            function(err, results, fields) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });

    app.get("/api/statistics/leaders", (req, res) => {
        console.log("Got: Leaders");

        if (!req.params.units || !isNaN(req.params.units) || req.params.units > 100) {
            units = 100;
        } else {
            units = req.params.units;
        }

        connection.query("SELECT u.country, u.name, a.identity, u.data, COUNT(DISTINCT a.bssid) AS amount FROM units u JOIN aps a ON u.identity = a.identity WHERE u.updated_at >= DATE_SUB(NOW(), INTERVAL 10 DAY) AND a.time > '2023-09-01 01:01:01' GROUP BY u.country, u.name, a.identity, u.data ORDER BY amount DESC LIMIT ?;",
            [units],
            function(err, results, fields) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });

    app.get("/api/statistics/unitsByDay", (req, res) => {
        console.log("Got: units By Day");

        if (!req.params.days || !isNaN(req.params.days) || req.params.days > 365) {
            units = 365;
        } else {
            units = req.params.days;
        }

        connection.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS units FROM units GROUP BY day ORDER BY day DESC LIMIT ?",
            [units],
            function(err, results, fields) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });
    //End of statisics
};