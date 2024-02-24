const express = require('express')
const db = require('../db')
const authenticate = require('../middlewares').authenticate
const logger = require('../logger')('routes-search')

const router = express.Router()

function getLimit (req) {
  if (!req.query.limit || isNaN(req.query.limit) || req.query.limit > 10) {
    return 10
  } else {
    return parseInt(req.query.limit)
  }
}

function getName (req) {
  if (!req.params.name || req.params.name.length > 32) {
    return ''
  } else {
    return req.params.name
  }
}

// Base endpoint: /api/v1/search/
router.get('/byID/:fingerprint', (req, res) => {
  // e.g /fingerprint?limit=10&name=lor%
  // got unit search for web
  // https://pwnagotchi.ai/api/grid/#get-api-v1-unit-fingerprint
  logger.info('Got web search for ' + req.params.fingerprint)
  // Query fingerprint via mysql
  db.units.webSearch(req.params.fingerprint, (err, unit) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (!unit) {
      logger.info('Unit not found')
      res.status(404).json({ error: 'Not Found' })
      return
    }
    res.json(unit)
  })
})

router.get('/byName/:name', (req, res) => {
  logger.info('Got web search for ' + req.params.name)
  const name = getName(req)
  const limit = getLimit(req)
  logger.info(limit)
  db.units.webSearchByName(name , limit, (err, names) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (!names) {
      logger.info('Unit not found')
      res.status(404).json({ error: 'Not Found' })
      return
    }
    logger.info(names)
    res.json(names)
  })
})


module.exports = router
