const jwt = require('jsonwebtoken')
const { DateTime } = require('luxon')
const config = require('../config').jwt

// Expiration time of tokens
const minutesToExpire = 60

function updateToken (identity, id) {
  const now = DateTime.utc().plus({ minutes: minutesToExpire }).toRFC2822()

  const token = jwt.sign({
    authorized: true,
    unit_id: id,
    unit_ident: identity,
    expires_at: now
  }, config.secret, { algorithm: 'HS256' })
  return token
}

module.exports = updateToken
