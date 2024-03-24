const express = require('express')
const db = require('../db')
const logger = require('../logger')('routes-unit')


const router = express.Router()


function getUnits (req) {
  if (!req.query.units || isNaN(req.query.units) || req.query.units > 100) {
    return 100
  } else {
    return parseInt(req.query.units)
  }
}

function getName (req) {
  if (!req.params.name || req.params.name.length > 32) {
    return ''
  } else {
    return req.params.name
  }
}

// Base endpoint: /api/v1/units
router.get('/', (req, res) => {
  // TODO: implement
  res.send('Custom API for a new pwn system')
})

router.get('/countries', (req, res) => {
  db.units.countries((err, countries) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    let c = []
    countries.forEach(element => {
      c.push(element.country)
    });
    res.json(c)
  })
})

router.get('/ByCountry/:name', (req, res) => {
  // TODO: add pages like messages
  data = req.query.data
  limit = getUnits(req)
  db.units.byCountry(req.query.country, limit, getName(req), data, (err, units) => {
    if (err) {
      logger.error(err)
      res.status(500).json({ error: 'Internal Server Error' })
      return
    }
    res.json(units)
  })
})

module.exports = router
