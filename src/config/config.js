const dotenv = require('dotenv')
const logger = require('../logger')('config')

dotenv.config()

function parseEnvVar (name) {
  const value = process.env[name]
  if (!value || value === '') {
    logger.error(`No value set for env var "${name}"`)
    process.exit(1)
  }
  return value
}

const db = {
  host: parseEnvVar('DB_HOST'),
  port: process.env.DB_PORT || 3306,
  user: parseEnvVar('DB_USER'),
  password: parseEnvVar('DB_PASS'),
  database: parseEnvVar('DB')
}

const jwt = {
  secret: parseEnvVar('SECRET')
}

const api = {
  port: parseEnvVar('PORT')
}

function isProd () { return process.env.NODE_ENV === 'production' }

module.exports = {
  db,
  jwt,
  api,
  isProd
}
