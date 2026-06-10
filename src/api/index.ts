import axios from 'axios'
import type { Product, AISearchResult, AIProductLookup, AIInvoiceResult } from '@/types'

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

// Product API
export const productApi = {
  getAll: () => api.get<Product[]>('/products'),

  getById: (id: string) => api.get<Product>(`/products/${id}`),

  getByBarcode: (barcode: string) => api.get<Product>(`/products/barcode/${barcode}`),

  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    api.post<Product>('/products', product),

  update: (id: string, product: Partial<Product>) =>
    api.put<Product>(`/products/${id}`, product),

  delete: (id: string) => api.delete(`/products/${id}`),

  updateStock: (id: string, quantity: number) =>
    api.patch<Product>(`/products/${id}/stock`, { quantity }),
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
