require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')

const productsRouter = require('./routes/products')
const aiRouter = require('./routes/ai')

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/products', productsRouter)
app.use('/api/ai', aiRouter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})
