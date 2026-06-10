import axios from 'axios'
import type { Product, AISearchResult, AIProductLookup, AIInvoiceResult } from '@/types'
import { supabase } from '@/lib/supabase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Gemini API Key to AI routes
api.interceptors.request.use((config) => {
  if (config.url?.startsWith('/ai/')) {
    const stored = localStorage.getItem('settings')
    if (stored) {
      try {
        const apiKey = JSON.parse(stored).geminiApiKey
        if (apiKey) {
          config.headers['x-gemini-api-key'] = apiKey
        }
      } catch (e) {}
    }
  }
  return config
})

// Helper to handle Supabase response like Axios
const handleSupabase = async (request: Promise<{ data: any; error: any }>) => {
  const { data, error } = await request
  if (error) throw new Error(error.message)
  return { data }
}

// Product API via Supabase
export const productApi = {
  getAll: () => handleSupabase(supabase.from('products').select('*').order('createdAt', { ascending: false })),

  getById: (id: string) => handleSupabase(supabase.from('products').select('*').eq('id', id).single()),

  getByBarcode: (barcode: string) => handleSupabase(supabase.from('products').select('*').eq('barcode', barcode).single()),

  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    handleSupabase(supabase.from('products').insert([product]).select().single()),

  update: (id: string, product: Partial<Product>) =>
    handleSupabase(supabase.from('products').update(product).eq('id', id).select().single()),

  delete: (id: string) => handleSupabase(supabase.from('products').delete().eq('id', id)),

  // Update stock is just a partial update in Supabase
  updateStock: async (id: string, quantity: number) => {
    // Get current stock
    const { data: current } = await supabase.from('products').select('stock').eq('id', id).single()
    const newStock = (current?.stock || 0) + quantity
    return handleSupabase(supabase.from('products').update({ stock: newStock }).eq('id', id).select().single())
  },
}

// AI Search API
export const aiApi = {
  searchProducts: (query: string) =>
    api.post<AISearchResult>('/ai/search', { query }),

  lookupProduct: (barcode: string) =>
    api.post<AIProductLookup>('/ai/lookup', { barcode }),

  scanInvoice: (imageFile: File) => {
    const formData = new FormData()
    formData.append('image', imageFile)
    return api.post<AIInvoiceResult>('/ai/scan-invoice', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default api
