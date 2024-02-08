const express = require('express')
require('dotenv').config()
const cors = require('cors')
const routes = require('./routes')
const logger = require('./logger')('main')
const middlewares = require('./middlewares')

// get port on which service should be available from env
const port = process.env.PORT

const app = express()

console.log(`[START] enviroment: ${process.env.ENVIROMENT}`)

app.use(middlewares.logger)

if (process.env.NODE_ENV === 'production') { app.use(cors({ origin: ['https://opwngrid.xyz', 'https://api.opwngrid.xyz'] })) }

app.use('/api/v1/units', routes.units)
app.use('/api/v1/unit', routes.unit)
app.use('/api/v1/uptime', routes.uptime)
app.use('/api/v1/total', routes.total)
app.use('/api/v1/recent', routes.recent)
app.use('/api/v1/search', routes.search)
app.use('/api/statistics', routes.statistics) // FIXME: doesn't follow APIs logic -> should be changed to /api/v1/statistics

// 404 not found
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found'
  })
})

// App Listen ---------------------------
app.listen(port, () => {
  logger.info(`Server listening on port ${port}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})
