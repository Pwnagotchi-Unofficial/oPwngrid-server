const jwt = require('jsonwebtoken')
require("dotenv").config();
const { DateTime } = require("luxon");
const minutes = 60 //Exp of tokens

function updateToken(identity,id) {

    let now = DateTime.utc().plus({ minutes: minutes }).toRFC2822()
    console.log(identity)
        
    token = jwt.sign({
        authorized : true,
        unit_id : id,
        unit_ident : identity,
        expires_at : now
    },process.env.SECRET, { algorithm: 'HS256'})
    console.log("Created New token: " + token)
    return token
}

module.exports = updateToken