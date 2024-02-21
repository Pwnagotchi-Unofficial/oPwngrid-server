const express = require('express')
const cors = require('cors')
const config = require('./config')
const routes = require('./routes')
const logger = require('./logger')('main')
const middlewares = require('./middlewares')

const app = express()

// Middlewares
app.use(middlewares.logger)
app.use(express.json({ inflate: true, strict: false, type: () => { return true } })) // Forcing parsing body as JSON, pwngrid doesn't set Content-Type header when making requests

if (config.isProd()) { app.use(cors({ origin: ['https://opwngrid.xyz', 'https://api.opwngrid.xyz'] })) }

// API routes
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
app.listen(config.api.port, () => {
  logger.info(`Server listening on port ${config.api.port}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})
