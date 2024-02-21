require('dotenv').config()
const jwt = require('jsonwebtoken')

function authenticate (req, res, next) {
  if (!req.headers.authorization) {
    res.locals.authorised = false
    console.warn('Warning : unauthenticated request')
    next()
  } else {
    const token = req.headers.authorization.slice('Bearer '.length)
    if (token.length >= 63) {
      let decoded = null
      try {
        decoded = jwt.verify(token, process.env.SECRET)
      } catch (err) {
        console.log(err)
        console.log('Error Decoding sending 401')
        res.status(401).json({ error: 'token expired or cannot be authenticated' })
        return
      }
      // create a check to see if token is expired
      if (decoded.authorized === true) {
        res.locals.author = decoded
        res.locals.authorised = true
        console.warn('Warning : authenticated request from ' + res.locals.author.unit_ident[1])
      } else if (decoded.authorized === false) {
        console.warn('Warning : unauthenticated request from ' + res.locals.author.unit_ident[1])
        res.locals.authorised = false
      }
      next()
      return
    }
    res.locals.authorised = false
    console.warn('Warning : unauthenticated request')
    next()
  }
}

module.exports = { authenticate }
