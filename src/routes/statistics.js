const express = require('express')
const db = require('../db')
const logger = require('../logger')('routes-statistics')

// All handlers for page with global statistics and specific units
function getDays (req) {
  if (!req.params.days || isNaN(req.query.days) || req.query.days > 365) {
    return 365
  } else {
    return parseInt(req.query.days)
  }
}

function getUnits (req) {
  if (!req.query.units || isNaN(req.query.units) || req.query.units > 100) {
    return 100
  } else {
    return parseInt(req.query.units)
  }
}
// makes sure the unit fingerprint is ok.
function getUnit (req) {
  if (!req.query.unit || req.query.unit.length < 63) {
    return null
  } else {
    return req.query.unit
  }
}

const router = express.Router()

// Base endpoint: /api/statistics
router.get('/apsByDay', (req, res) => {
  // e.g /apsbyDay?unit=fingerprint
  const days = getDays(req)
  const unit = getUnit(req)
  if (req.query.unit && unit == null){
    res.status(200).json({ status: 'Fingerprint does not conform' })
    return
  }
  db.statistics.apsByDay(days, unit, (err, results) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    if (results.length === 0) {
      res.status(200).json({ status: 'Fingerprint does not exist' })
      return
    }
    res.send(results)
  })
})

router.get('/messagesByDay', (req, res) => {
  const days = getDays(req)
  db.statistics.messagesByDay(days, (err, results) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(results)
  })
})

router.get('/leaders', (req, res) => {
  logger.info('Got: Leaders')
  logger.info(req.query.units)
  const units = getUnits(req)

  db.statistics.leaders(units, (err, results) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(results)
  })
})

router.get('/unitsByDay', (req, res) => {
  const days = getDays(req)
  db.statistics.unitsByDay(days, (err, results) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(results)
  })
})

router.get('/unitsByCountry', (req, res) => {
  const days = getDays(req)
  db.statistics.unitsByCountry(days, (err, results) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.send(results)
  })
})

module.exports = router
