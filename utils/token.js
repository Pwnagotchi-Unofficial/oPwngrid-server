const jwt = require("jsonwebtoken");
require("dotenv").config();
const { DateTime } = require("luxon");

// Expiration time of tokens
const minutesToExpire = 60;

function updateToken(identity, id) {

    const now = DateTime.utc().plus({ minutes: minutesToExpire }).toRFC2822();

    const token = jwt.sign({
        authorized : true,
        unit_id : id,
        unit_ident : identity,
        expires_at : now
    }, process.env.SECRET, { algorithm: "HS256"});
    return token;
}

module.exports = updateToken;