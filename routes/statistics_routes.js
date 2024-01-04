// All handlers for page with global statistics
function getDays(req) {
    if (!req.params.days || isNaN(req.query.days) || req.query.days > 365) {
        return 365;
    } else {
        return req.query.days;
    }
}

function getUnits(req) {
    if (!req.query.units || isNaN(req.query.units) || req.query.units > 100) {
        return 100;
    } else {
        return req.query.units;
    }
}

module.exports = function(app, connection) {
    app.get("/api/statistics/apsByDay", (req, res) => {
        console.log("Got: /api/statisics/apsByDay Called");
        const days = getDays(req);

        connection.query("SELECT DATE_FORMAT(time, '%Y-%m-%d') AS day, COUNT(ID) AS reported FROM aps GROUP BY day ORDER BY day DESC LIMIT ?",
            [ days ],
            function(err, results) {
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
        const days = getDays(req);

        connection.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS messages FROM messages GROUP BY day ORDER BY day DESC LIMIT ?",
            [ days ],
            function(err, results) {
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
        console.log(req.query.units);
        const units = getUnits(req);

        connection.query("SELECT u.country, u.name, a.identity, u.data, COUNT(DISTINCT a.bssid) AS amount FROM units u JOIN aps a ON u.identity = a.identity WHERE u.updated_at >= DATE_SUB(NOW(), INTERVAL 10 DAY) AND a.time > '2023-09-01 01:01:01' GROUP BY u.country, u.name, a.identity, u.data ORDER BY amount DESC LIMIT ?;",
            [ units ],
            function(err, results) {
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
        const days = getDays(req);

        connection.query("SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS day, COUNT(ID) AS units FROM units GROUP BY day ORDER BY day DESC LIMIT ?",
            [ days ],
            function(err, results) {
                if (err) {
                    res.status(500).json({"error":"Internal Server Error"});
                    console.log(err);
                    return;
                }
                res.send(results);
            });
        return;
    });
};