import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
import { productApi } from '@/api'
import { localDb } from '@/lib/localDb'
import { useSnackbar } from '@/composables/useSnackbar'

export const useProductStore = defineStore('products', () => {
  const { success, error: showError } = useSnackbar()
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const productCount = computed(() => products.value.length)

  const lowStockProducts = computed(() =>
    products.value.filter((p) => p.stock <= 5)
  )

  async function fetchProducts() {
    loading.value = true
    error.value = null
    try {
      // 1. Load from local DB first for instant UI
      const localData = await localDb.getProducts()
      if (localData && localData.length > 0) {
        products.value = localData
      }

      // 2. Fetch fresh from Supabase if online
      if (navigator.onLine) {
        const { data } = await productApi.getAll()
        products.value = data
        await localDb.setProducts(data)
      }
    } catch (err: any) {
      error.value = err.message || 'Gagal memuat produk'
      console.error('Failed to fetch from supabase', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchByBarcode(barcode: string): Promise<Product | null> {
    // Search local first, should be up to date
    return products.value.find((p) => p.barcode === barcode) || null
  }

  async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      if (navigator.onLine) {
        const { data } = await productApi.create(product)
        products.value.push(data)
        await localDb.setProducts(products.value)
        return data
      } else {
        throw new Error('Offline')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg === 'Offline' || msg.includes('Failed to fetch') || !navigator.onLine) {
        // Offline fallback
        const newProduct: Product = {
          ...product,
          id: `NEW-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        products.value.push(newProduct)
        await localDb.setProducts(products.value)
        success('Produk ditambahkan secara lokal (Offline mode).')
        return newProduct
      } else {
        // Real server error
        showError('Gagal menambah produk: ' + msg)
        throw err
      }
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      if (navigator.onLine) {
        const { data } = await productApi.update(id, updates)
        const index = products.value.findIndex((p) => p.id === id)
        if (index !== -1) {
          products.value[index] = data
          await localDb.setProducts(products.value)
        }
      } else {
        throw new Error('Offline')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg === 'Offline' || msg.includes('Failed to fetch') || !navigator.onLine) {
        const index = products.value.findIndex((p) => p.id === id)
        if (index !== -1) {
          products.value[index] = { ...products.value[index], ...updates, updatedAt: new Date().toISOString() }
          await localDb.setProducts(products.value)
          success('Produk diperbarui secara lokal (Offline mode).')
        }
      } else {
        showError('Gagal memperbarui produk: ' + msg)
        throw err
      }
    }
  }

  async function deleteProduct(id: string) {
    try {
      if (navigator.onLine) {
        await productApi.delete(id)
        products.value = products.value.filter((p) => p.id !== id)
        await localDb.setProducts(products.value)
      } else {
        throw new Error('Offline')
      }
    } catch (err: any) {
      const msg = err.message || ''
      if (msg === 'Offline' || msg.includes('Failed to fetch') || !navigator.onLine) {
        products.value = products.value.filter((p) => p.id !== id)
        await localDb.setProducts(products.value)
        success('Produk dihapus secara lokal (Offline mode).')
      } else {
        showError('Gagal menghapus produk: ' + msg)
        throw err
      }
    }
  }

  // Fast UI helper for cart
  function updateLocalStock(id: string, delta: number) {
    const p = products.value.find(p => p.id === id)
    if (p) {
      p.stock = Math.max(0, p.stock + delta)
      localDb.setProducts(products.value).catch(console.error)
    }
  }

  return {
    products,
    loading,
    error,
    productCount,
    lowStockProducts,
    fetchProducts,
    fetchByBarcode,
    addProduct,
    updateProduct,
    deleteProduct,
    updateLocalStock,
  }
})
