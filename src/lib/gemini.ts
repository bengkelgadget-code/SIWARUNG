import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AIProductLookup, AIInvoiceResult, Product } from '@/types'

// Helper to get API Key from localStorage (Settings store)
function getApiKey(): string {
  const stored = localStorage.getItem('settings')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      return parsed.geminiApiKey || ''
    } catch (e) {}
  }
  return ''
}

// Convert base64 data URL to generative AI part
function base64ToGenerativePart(base64DataUrl: string) {
  const base64String = base64DataUrl.split(',')[1]
  const mimeType = base64DataUrl.substring(base64DataUrl.indexOf(':') + 1, base64DataUrl.indexOf(';'))
  return {
    inlineData: {
      data: base64String,
      mimeType
    }
  }
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  imagePart?: any,
  maxRetries = 2,
  onProgress?: (msg: string) => void
): Promise<string> {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  
  for (const modelName of modelsToTry) {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { responseMimeType: 'application/json' }
    })
    
    let attempt = 0
    while (attempt <= maxRetries) {
      try {
        if (attempt > 0) {
          onProgress?.(`Server sibuk, mencoba ulang (ke-${attempt} dengan ${modelName})...`)
        } else if (modelName !== modelsToTry[0]) {
          onProgress?.(`Beralih ke model cadangan (${modelName})...`)
        }

        const parts = imagePart ? [prompt, imagePart] : [prompt]
        const result = await model.generateContent(parts)
        return result.response.text()
      } catch (err: any) {
        const is503 = err.message?.includes('503') || err.message?.includes('high demand')
        const is429 = err.message?.includes('429') || err.message?.includes('quota')
        
        if (is503 || is429) {
          if (attempt === maxRetries) break
          attempt++
          const delay = attempt * 1500
          onProgress?.(`Server penuh, menunggu ${delay/1000} detik...`)
          await sleep(delay)
        } else {
          throw err // Invalid API key or other hard errors
        }
      }
    }
  }
  
  throw new Error('Server AI sedang sangat sibuk. Semua percobaan gagal. Silakan coba lagi nanti.')
}

export const geminiApi = {
  // Recognize a product from an image
  async identifyProductFromImage(base64Image: string, onProgress?: (msg: string) => void): Promise<AIProductLookup> {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('API Key Gemini belum dikonfigurasi di menu Pengaturan.')

    const prompt = `Anda adalah sistem AI pendeteksi barang kasir (POS) warung/minimarket di Indonesia.
Saya akan memberikan gambar sebuah produk. Anda harus mengidentifikasinya dan mengembalikan data dalam format JSON.

Jika gambar tidak jelas atau bukan barang jualan, set "found" ke false.
Jika berhasil diidentifikasi, isi data berdasarkan kemasan dan tebakan umum untuk pasar Indonesia.

Struktur JSON yang WAJIB Anda ikuti:
{
  "found": boolean,
  "name": "Nama lengkap produk beserta ukuran/varian jika terlihat (misal: Nabati Wafer Keju 50g)",
  "category": "Pilih salah satu: Makanan, Minuman, Snack, Kebutuhan Rumah, Kesehatan, Lainnya",
  "price": number (estimasi harga jual wajar di warung/minimarket Indonesia saat ini, misal 2000),
  "unit": "Pilih salah satu: pcs, kg, liter, box, pack, botol, kaleng",
  "description": "Deskripsi singkat mengenai produk ini",
  "confidence": "high" | "medium" | "low"
}`

    const imagePart = base64ToGenerativePart(base64Image)
    
    try {
      let text = await callGeminiWithRetry(apiKey, prompt, imagePart, 2, onProgress)
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const json = JSON.parse(text)
      return json as AIProductLookup
    } catch (err: any) {
      console.error('Gemini Product Error:', err)
      const msg = err.message.includes('API key not valid') ? 'API Key tidak valid.' : err.message
      throw new Error(msg || 'Gagal memproses gambar dengan AI.')
    }
  },

  // Scan Invoice (Nota) from an image
  async scanInvoiceFromImage(base64Image: string, onProgress?: (msg: string) => void): Promise<AIInvoiceResult> {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('API Key Gemini belum dikonfigurasi di menu Pengaturan.')

    const prompt = `Anda adalah asisten AI untuk sistem kasir POS (SIWARUNG).
Tugas Anda adalah membaca gambar struk / nota belanja barang (kulakan) dan mengekstrak datanya ke format JSON.
Abaikan barang yang dibeli dengan kuantitas 0 atau harga 0.
Jika tidak ada nomor nota yang terlihat jelas, buat nomor otomatis "INV-" + timestamp saat ini.

Struktur JSON WAJIB:
{
  "invoiceNo": "nomor nota",
  "totalCost": total keseluruhan tagihan (angka),
  "items": [
    {
      "name": "nama barang",
      "quantity": jumlah barang (angka),
      "buyPrice": harga beli per satuan barang (angka)
    }
  ]
}`

    const imagePart = base64ToGenerativePart(base64Image)
    
    try {
      let text = await callGeminiWithRetry(apiKey, prompt, imagePart, 2, onProgress)
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const json = JSON.parse(text)
      return json as AIInvoiceResult
    } catch (err: any) {
      console.error('Gemini Invoice Error:', err)
      throw new Error(err.message || 'Gagal memproses gambar struk dengan AI.')
    }
  },

  // Smart Search for Products
  async searchProducts(query: string, products: Product[]): Promise<{ data: { items: any[] } }> {
    const apiKey = getApiKey()
    if (!apiKey) throw new Error('API Key Gemini belum dikonfigurasi di menu Pengaturan.')
    if (!products.length) return { data: { items: [] } }

    const catalog = products.map(p => ({ id: p.id, name: p.name, category: p.category, desc: p.description }))
    
    const prompt = `Anda adalah asisten pencarian produk cerdas (Semantic Search).
Pengguna mencari: "${query}"

Berikut adalah daftar katalog produk yang tersedia:
${JSON.stringify(catalog)}

Tugas Anda:
1. Temukan produk-produk yang paling relevan dengan maksud pencarian (toleransi sinonim, salah eja, atau kategori).
2. Kembalikan array JSON berisi objek yang memiliki "id" produk dan "confidenceScore" (0-1).
3. Urutkan dari yang paling relevan. Batasi maksimal 5 hasil.

Struktur JSON WAJIB:
{
  "items": [
    { "id": "id-produk", "confidenceScore": 0.95 }
  ]
}`

    try {
      let text = await callGeminiWithRetry(apiKey, prompt, undefined, 1)
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const json = JSON.parse(text)
      return { data: json }
    } catch (err: any) {
      console.error('Gemini Search Error:', err)
      throw new Error(err.message || 'Gagal melakukan pencarian cerdas dengan AI.')
    }
  }
}
