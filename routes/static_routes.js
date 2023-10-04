const express = require("express");

module.exports = function(app) {
    //routing for main website
    app.use(express.static(process.env.PWD + "/public"));
    app.get("/", (req, res) => {
        res.sendFile(process.env.PWD + "/public/index.html");
    });
    app.get("/search/*", (req, res) => {
        res.sendFile(process.env.PWD + "/public/search.html");
    });
    app.get("/search", (req, res) => {
        res.sendFile(process.env.PWD + "/public/search.html");
    });
    app.get("/convert", (req, res) => {
        res.sendFile(process.env.PWD + "/public/convert.html");
    });
    app.get("/css/:file", (req, res) => {
        res.sendFile(process.env.PWD + `/public/css/${req.params.file}`);
    });
    app.get("/leaderboard", (req, res) => {
        res.sendFile(process.env.PWD + "/public/leaderboard.html");
    });
    app.get("/statistics", (req, res) => {
        res.sendFile(process.env.PWD + "/public/statistics.html");
    });
};