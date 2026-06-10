const express = require('express')
const fs = require('fs')
const path = require('path')

const router = express.Router()
const DATA_FILE = path.join(__dirname, '..', 'data', 'products.json')

function readProducts() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(data)
}

function writeProducts(products) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2))
}

// GET all products
router.get('/', (req, res) => {
  try {
    const products = readProducts()
    res.json(products)
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat data produk' })
  }
})

// GET product by ID
router.get('/:id', (req, res) => {
  try {
    const products = readProducts()
    const product = products.find((p) => p.id === req.params.id)
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' })
    }
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Gagal memuat produk' })
  }
})

// GET product by barcode
router.get('/barcode/:barcode', (req, res) => {
  try {
    const products = readProducts()
    const product = products.find((p) => p.barcode === req.params.barcode)
    if (!product) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' })
    }
    res.json(product)
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencari produk' })
  }
})

// POST create product
router.post('/', (req, res) => {
  try {
    const products = readProducts()
    const newProduct = {
      ...req.body,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    products.push(newProduct)
    writeProducts(products)
    res.status(201).json(newProduct)
  } catch (err) {
    res.status(500).json({ error: 'Gagal menambah produk' })
  }
})

// PUT update product
router.put('/:id', (req, res) => {
  try {
    const products = readProducts()
    const index = products.findIndex((p) => p.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' })
    }
    products[index] = {
      ...products[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    }
    writeProducts(products)
    res.json(products[index])
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate produk' })
  }
})

// PATCH update stock
router.patch('/:id/stock', (req, res) => {
  try {
    const products = readProducts()
    const index = products.findIndex((p) => p.id === req.params.id)
    if (index === -1) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' })
    }
    products[index].stock = req.body.quantity
    products[index].updatedAt = new Date().toISOString()
    writeProducts(products)
    res.json(products[index])
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengupdate stok' })
  }
})

// DELETE product
router.delete('/:id', (req, res) => {
  try {
    let products = readProducts()
    products = products.filter((p) => p.id !== req.params.id)
    writeProducts(products)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Gagal menghapus produk' })
  }
})

module.exports = router
