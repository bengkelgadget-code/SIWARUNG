import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PurchaseRecord, PurchaseItem } from '@/types'
import { useProductStore } from './products'

export const usePurchaseStore = defineStore('purchases', () => {
  const productStore = useProductStore()
  
  // Initialize with some dummy data for preview
  const purchases = ref<PurchaseRecord[]>([
    {
      id: '1',
      invoiceNo: 'INV-001',
      totalCost: 200000,
      createdAt: new Date().toISOString(),
      items: [
        { name: 'Indomie Goreng', quantity: 40, buyPrice: 2500, productId: '1' },
        { name: 'Beras 5kg', quantity: 2, buyPrice: 50000, productId: '2' }
      ]
    }
  ])

  function addPurchase(invoiceNo: string, items: PurchaseItem[], totalCost: number) {
    const newPurchase: PurchaseRecord = {
      id: Date.now().toString(),
      invoiceNo,
      items,
      totalCost,
      createdAt: new Date().toISOString()
    }
    
    purchases.value.unshift(newPurchase)
    saveToLocal()
    
    // Automatically update stock for matched products
    items.forEach(item => {
      if (item.productId) {
        const product = productStore.products.find(p => p.id === item.productId)
        if (product) {
          productStore.updateProduct(product.id, {
            stock: product.stock + item.quantity
          })
        }
      }
    })
  }

  function saveToLocal() {
    localStorage.setItem('purchases', JSON.stringify(purchases.value))
  }

  function loadFromLocal() {
    const stored = localStorage.getItem('purchases')
    if (stored) {
      purchases.value = JSON.parse(stored)
    }
  }
  
  loadFromLocal()

  return {
    purchases,
    addPurchase
  }
})
