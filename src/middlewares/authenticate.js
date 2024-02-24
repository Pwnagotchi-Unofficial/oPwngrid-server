const jwt = require('jsonwebtoken')
const logger = require('../logger')('auth')
const config = require('../config').jwt
module.exports = (req, res, next) => {
  if (!req.headers.authorization) {
    res.locals.authorised = false
    logger.warn('Warning : unauthenticated request')
    next()
  } else {
    const token = req.headers.authorization.slice('Bearer '.length)
    if (token.length >= 63) {
      let decoded = null
      try {
        decoded = jwt.verify(token, config.secret)
      } catch (err) {
        logger.error(err)
        logger.info('Error Decoding sending 401')
        res.status(401).json({ error: 'token expired or cannot be authenticated' })
        return
      }
      // create a check to see if token is expired
      if (decoded.authorized === true) {
        res.locals.author = decoded
        res.locals.authorised = true
        logger.warn('Warning : authenticated request from ' + res.locals.author.unit_ident[1])
      } else if (decoded.authorized === false) {
        logger.warn('Warning : unauthenticated request from ' + res.locals.author.unit_ident[1])
        res.locals.authorised = false
      }
      next()
      return
    }
    res.locals.authorised = false
    logger.warn('Warning : unauthenticated request')
    next()
  }
}
