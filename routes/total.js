const express = require('express')
const db = require('../db')

const router = express.Router()

// Base endpoint: /api/v1/total
router.get('/', (req, res) => {
  // TODO: Preferably move to ORM
  db.units.total((err, total) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }
    res.send(total)
  })
})

router.get('/aps', (req, res) => {
  db.accessPoints.total((err, total) => {
    if (err) {
      res.status(500).json({ error: 'Internal Server Error' })
      console.log(err)
      return
    }

    res.send(total)
  })
})

module.exports = router
