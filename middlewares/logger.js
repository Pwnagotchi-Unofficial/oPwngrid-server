const logger = require('../logger')('http')

module.exports = (req, res, next) => {
  // TODO: should be added IP address, user agent, ...?
  logger.info(`${req.method} ${req.originalUrl} HTTP/${req.httpVersion}`)
  next()
}
