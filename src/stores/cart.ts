import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product, Transaction } from '@/types'
import { supabase } from '@/lib/supabase'
import { productApi } from '@/api'
import { localDb } from '@/lib/localDb'
import { useProductStore } from './products'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const transactions = ref<Transaction[]>([])

  const totalItems = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0)
  )

  const totalPrice = computed(() =>
    items.value.reduce((sum, item) => sum + item.subtotal, 0)
  )

  function addItem(product: Product, quantity: number = 1) {
    const existing = items.value.find((item) => item.product.id === product.id)
    if (existing) {
      existing.quantity += quantity
      existing.subtotal = existing.quantity * existing.product.price
    } else {
      items.value.push({
        product,
        quantity,
        subtotal: product.price * quantity,
      })
    }
  }

  function removeItem(productId: string) {
    items.value = items.value.filter((item) => item.product.id !== productId)
  }

  function updateQuantity(productId: string, quantity: number) {
    const item = items.value.find((item) => item.product.id === productId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      item.subtotal = item.quantity * item.product.price
    }
  }

  function clearCart() {
    items.value = []
  }

  async function checkout(payment: number): Promise<Transaction> {
    const transactionId = `TRX-${Date.now()}`
    const transactionData = {
      id: transactionId,
      items: items.value,
      total: totalPrice.value,
      payment,
      change: payment - totalPrice.value,
    }

    try {
      const newTransaction: Transaction = {
        ...transactionData,
        createdAt: new Date().toISOString(),
      }

      // 1. Add to local transactions state
      transactions.value.unshift(newTransaction)
      await localDb.setTransactions(transactions.value)

      // 2. Reduce local stock immediately for fast UI
      const productStore = useProductStore()
      for (const item of items.value) {
        productStore.updateLocalStock(item.product.id, -item.quantity)
      }

      // 3. Add to sync queue for background sync to Supabase
      await localDb.addToQueue('ADD_TRANSACTION', newTransaction)

      clearCart()
      return newTransaction
    } catch (e: any) {
      console.error('Checkout failed', e)
      alert('Gagal memproses transaksi (Lokal): ' + e.message)
      throw e
    }
  }

  async function loadTransactions() {
    try {
      // 1. Load from local DB first for instant UI
      const localData = await localDb.getTransactions()
      if (localData && localData.length > 0) {
        transactions.value = localData
      }

      // 2. Fetch fresh from Supabase if online
      if (navigator.onLine) {
        const { data, error } = await supabase.from('transactions').select('*').order('createdAt', { ascending: false })
        if (!error && data) {
          transactions.value = data
          await localDb.setTransactions(data)
        }
      }
    } catch (e) {
      console.error('Failed to load transactions')
    }
  }

  async function deleteTransaction(transactionId: string) {
    try {
      const trx = transactions.value.find(t => t.id === transactionId)
      if (trx) {
        // 1. Restore local stock instantly
        const productStore = useProductStore()
        for (const item of trx.items) {
          productStore.updateLocalStock(item.product.id, item.quantity)
        }
        
        // 2. Remove from local transactions
        transactions.value = transactions.value.filter(t => t.id !== transactionId)
        await localDb.setTransactions(transactions.value)

        // 3. Add to sync queue for supabase deletion
        await localDb.addToQueue('DELETE_TRANSACTION', { id: transactionId, items: trx.items })
      }
    } catch (e: any) {
      console.error('Failed to delete transaction locally', e)
      alert('Gagal menghapus transaksi (Lokal): ' + e.message)
      throw e
    }
  }

  return {
    items,
    transactions,
    totalItems,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    checkout,
    loadTransactions,
    deleteTransaction,
  }
})
