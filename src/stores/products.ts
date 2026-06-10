import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Product } from '@/types'
import { productApi } from '@/api'

export const useProductStore = defineStore('products', () => {
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
      const { data } = await productApi.getAll()
      products.value = data
    } catch (err: any) {
      error.value = err.message || 'Gagal memuat produk'
      // Fallback to local storage
      const stored = localStorage.getItem('products')
      if (stored) products.value = JSON.parse(stored)
    } finally {
      loading.value = false
    }
  }

  async function fetchByBarcode(barcode: string): Promise<Product | null> {
    try {
      const { data } = await productApi.getByBarcode(barcode)
      return data
    } catch {
      // Fallback: search local
      return products.value.find((p) => p.barcode === barcode) || null
    }
  }

  async function addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data } = await productApi.create(product)
      products.value.push(data)
      return data
    } catch {
      // Fallback: add locally
      const newProduct: Product = {
        ...product,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      products.value.push(newProduct)
      saveToLocal()
      return newProduct
    }
  }

  async function updateProduct(id: string, updates: Partial<Product>) {
    try {
      const { data } = await productApi.update(id, updates)
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) products.value[index] = data
    } catch {
      const index = products.value.findIndex((p) => p.id === id)
      if (index !== -1) {
        products.value[index] = { ...products.value[index], ...updates, updatedAt: new Date().toISOString() }
        saveToLocal()
      }
    }
  }

  async function deleteProduct(id: string) {
    try {
      await productApi.delete(id)
      products.value = products.value.filter((p) => p.id !== id)
    } catch {
      products.value = products.value.filter((p) => p.id !== id)
      saveToLocal()
    }
  }

  function saveToLocal() {
    localStorage.setItem('products', JSON.stringify(products.value))
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
  }
})
