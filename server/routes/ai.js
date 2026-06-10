const express = require('express')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const router = express.Router()
const DATA_FILE = path.join(__dirname, '..', 'data', 'products.json')

const upload = multer({ storage: multer.memoryStorage() })

function readProducts() {
  const data = fs.readFileSync(DATA_FILE, 'utf-8')
  return JSON.parse(data)
}

function getGenAI(req) {
  const apiKey = req.headers['x-gemini-api-key'] || process.env.GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenerativeAI(apiKey)
}

// POST AI Search
router.post('/search', async (req, res) => {
  try {
    const { query } = req.body

    if (!query) {
      return res.status(400).json({ error: 'Query pencarian kosong' })
    }

    const products = readProducts()
    const genAI = getGenAI(req)

    // If no Gemini API key, fallback to simple search
    if (!genAI) {
      const lowerQuery = query.toLowerCase()
      const matchedProducts = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.category.toLowerCase().includes(lowerQuery) ||
          p.description?.toLowerCase().includes(lowerQuery)
      )

      return res.json({
        products: matchedProducts.length > 0 ? matchedProducts : products.slice(0, 5),
        suggestion: matchedProducts.length > 0
          ? `Ditemukan ${matchedProducts.length} produk yang cocok (Pencarian Biasa).`
          : 'Tidak ada produk yang cocok, menampilkan produk terbaru.',
      })
    }

    // Use Gemini AI for intelligent search
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const productSummary = products
      .map((p) => `- ${p.name} (${p.category}) - Rp${p.price} - Stok: ${p.stock} ${p.unit}`)
      .join('\n')

    const prompt = `Kamu adalah asisten pencarian produk untuk toko retail.
Berikut daftar produk yang tersedia:
${productSummary}

Pengguna mencari: "${query}"

Berikan respon dalam format JSON dengan struktur:
{
  "matchedIds": ["id1", "id2", ...],
  "suggestion": "saran singkat dalam bahasa Indonesia"
}

Pilih produk yang paling relevan dengan pencarian pengguna. Maksimal 5 produk.
Hanya berikan JSON, tanpa teks tambahan.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse AI response
    let aiResponse
    try {
      aiResponse = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())
    } catch {
      // Fallback if AI response parsing fails
      aiResponse = { matchedIds: [], suggestion: 'Pencarian selesai.' }
    }

    const matchedProducts = aiResponse.matchedIds?.length
      ? products.filter((p) => aiResponse.matchedIds.includes(p.id))
      : products.slice(0, 5)

    res.json({
      products: matchedProducts,
      suggestion: aiResponse.suggestion || 'Berikut produk yang ditemukan.',
    })
  } catch (err) {
    console.error('AI Search Error:', err.message)

    // Fallback to simple search
    const products = readProducts()
    const lowerQuery = req.body.query?.toLowerCase() || ''
    const matchedProducts = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    )

    res.json({
      products: matchedProducts.length > 0 ? matchedProducts : products.slice(0, 5),
      suggestion: 'Pencarian AI gagal, menggunakan pencarian biasa.',
    })
  }
})

// POST AI Product Lookup (barcode -> product info via Gemini)
router.post('/lookup', async (req, res) => {
  try {
    const { barcode } = req.body

    if (!barcode) {
      return res.status(400).json({ error: 'Barcode kosong' })
    }

    const genAI = getGenAI(req)

    // If no Gemini API key, return basic info
    if (!genAI) {
      return res.json({
        found: false,
        name: '',
        category: '',
        price: 0,
        unit: 'pcs',
        description: '',
        confidence: 'low',
        message: 'Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY di Pengaturan AI.'
      })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const prompt = `Kamu adalah database produk retail Indonesia. Diberikan barcode produk: "${barcode}"

Berikan informasi detail tentang produk ini dalam format JSON:
{
  "found": true/false,
  "name": "nama lengkap produk",
  "category": "salah satu dari: Makanan, Minuman, Snack, Kebutuhan Rumah, Kesehatan, Lainnya",
  "price": estimasi_harga_dalam_rupiah_angka_saja,
  "unit": "satuan (pcs, kg, liter, box, pack, botol, kaleng)",
  "description": "deskripsi singkat produk dalam bahasa Indonesia",
  "confidence": "high/medium/low"
}

Jika kamu mengenali produk dari barcode tersebut, isi dengan data yang akurat.
Jika tidak yakin, set found: true tapi confidence: low.
Jika sama sekali tidak tahu, set found: false.
Hanya berikan JSON, tanpa teks tambahan.`

    const result = await model.generateContent(prompt)
    const text = result.response.text()

    let productInfo
    try {
      productInfo = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())
    } catch {
      return res.json({
        found: false,
        name: '',
        category: '',
        price: 0,
        unit: 'pcs',
        description: '',
        confidence: 'low',
      })
    }

    res.json(productInfo)
  } catch (err) {
    console.error('AI Lookup Error:', err.message)
    res.status(500).json({
      found: false,
      name: '',
      category: '',
      price: 0,
      unit: 'pcs',
      description: '',
      confidence: 'low',
      error: 'Gagal melakukan lookup produk'
    })
  }
})

// POST AI Scan Invoice (Image -> JSON via Gemini)
router.post('/scan-invoice', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada gambar yang diunggah' })
    }

    const genAI = getGenAI(req)
    if (!genAI) {
      return res.status(401).json({ error: 'API Key Gemini belum disetel. Silakan isi di menu Pengaturan.' })
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

    const imagePart = {
      inlineData: {
        data: req.file.buffer.toString('base64'),
        mimeType: req.file.mimetype,
      },
    }

    const prompt = `Ekstrak data dari nota/struk belanja ini.
Berikan respons HANYA berupa JSON dengan struktur berikut:
{
  "invoiceNo": "nomor_nota_atau_struk",
  "totalCost": total_belanja_angka_saja,
  "items": [
    {
      "name": "nama barang",
      "quantity": jumlah_barang_angka_saja,
      "buyPrice": harga_beli_satuan_angka_saja
    }
  ]
}
Jika nomor nota tidak ditemukan, buatkan string acak dengan awalan 'INV-'.
Jika ada atribut yang tidak terbaca, kosongkan atau isi dengan 0.
Hanya kembalikan JSON murni, tanpa markdown \`\`\`json.`

    const result = await model.generateContent([prompt, imagePart])
    const text = result.response.text()

    let invoiceData
    try {
      invoiceData = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim())
    } catch (e) {
      console.error('Failed to parse Gemini output:', text)
      return res.status(500).json({ error: 'Gagal membaca format nota dari AI' })
    }

    // Wrap in standard 'data' envelope to match frontend expectation
    res.json({ data: invoiceData })
  } catch (err) {
    console.error('AI Scan Invoice Error:', err.message)
    res.status(500).json({ error: 'Gagal memproses nota dengan AI' })
  }
})

module.exports = router
