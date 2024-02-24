const pino = require('pino')
// TODO: in prod this format should be replaced with JSON format for further manipulation
const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      singleLine: true,
      translateTime: 'yyyy-mm-dd"T"HH:MM:ss',
      messageFormat: '[{module}] {msg}',
      ignore: 'pid,hostname,module'
    }
  }
})

module.exports = (module) => {
  return logger.child({
    module
  })
}
