const express = require('express')
const db = require('../db')

// All handlers for page with global statistics
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

const router = express.Router()

// Base endpoint: /api/statistics
router.get('/apsByDay', (req, res) => {
  console.log('Got: /api/statisics/apsByDay Called')
  const days = getDays(req)

  db.statistics.apsByDay(days, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(results)
  })
})

router.get('/messagesByDay', (req, res) => {
  console.log('Got: /api/statisics/apsByDay Called')
  const days = getDays(req)

  db.statistics.messagesByDay(days, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(results)
  })
})

router.get('/leaders', (req, res) => {
  console.log('Got: Leaders')
  console.log(req.query.units)
  const units = getUnits(req)

  db.statistics.leaders(units, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(results)
  })
})

router.get('/unitsByDay', (req, res) => {
  console.log('Got: units By Day')
  const days = getDays(req)

  db.statistics.unitsByDay(days, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(results)
  })
})

router.get('/unitsByCountry', (req, res) => {
  console.log('Got: units By Day')
  const days = getDays(req)

  db.statistics.unitsByCountry(days, (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(results)
  })
})

module.exports = router
