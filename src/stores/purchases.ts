import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { PurchaseRecord, PurchaseItem } from '@/types'
import { useProductStore } from './products'
import { supabase } from '@/lib/supabase'
import { productApi } from '@/api'
import { useSnackbar } from '@/composables/useSnackbar'

export const usePurchaseStore = defineStore('purchases', () => {
  const productStore = useProductStore()
  
  const purchases = ref<PurchaseRecord[]>([])

  async function addPurchase(invoiceNo: string, items: PurchaseItem[], totalCost: number) {
    const newPurchase = {
      id: Date.now().toString(),
      invoiceNo,
      items,
      totalCost,
      // createdAt handled by supabase
    }
    
    try {
      await supabase.from('purchases').insert([newPurchase])

      // Automatically update stock for matched products
      for (const item of items) {
        if (item.productId) {
          await productApi.updateStock(item.productId, item.quantity)
          productStore.updateLocalStock(item.productId, item.quantity)
        }
      }

      purchases.value.unshift({ ...newPurchase, createdAt: new Date().toISOString() })
    } catch (e: any) {
      console.error('Failed to save purchase history', e)
      const { error: showError } = useSnackbar()
      showError('Gagal menyimpan riwayat nota: ' + e.message)
      throw e
    }
  }

  async function loadPurchases() {
    try {
      const { data, error } = await supabase.from('purchases').select('*').order('createdAt', { ascending: false })
      if (!error && data) {
        purchases.value = data
      }
    } catch (e) {
      console.error('Failed to load purchases', e)
    }
  }

  return {
    purchases,
    addPurchase,
    loadPurchases
  }
})
