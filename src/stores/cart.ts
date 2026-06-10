import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product, Transaction } from '@/types'
import { supabase } from '@/lib/supabase'
import { productApi } from '@/api'

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
      // createdAt is handled by supabase default
    }

    try {
      // 1. Insert transaction to supabase
      await supabase.from('transactions').insert([transactionData])
      
      // 2. Reduce stock for each item
      for (const item of items.value) {
        // Decrease stock (so we pass negative quantity)
        await productApi.updateStock(item.product.id, -item.quantity)
      }

      const newTransaction: Transaction = {
        ...transactionData,
        createdAt: new Date().toISOString(),
      }
      transactions.value.unshift(newTransaction)
      clearCart()
      return newTransaction
    } catch (e: any) {
      console.error('Checkout failed', e)
      alert('Gagal memproses transaksi: ' + e.message)
      throw e
    }
  }

  async function loadTransactions() {
    try {
      const { data, error } = await supabase.from('transactions').select('*').order('createdAt', { ascending: false })
      if (!error && data) {
        transactions.value = data
      }
    } catch (e) {
      console.error('Failed to load transactions')
    }
  }

  async function deleteTransaction(transactionId: string) {
    try {
      const trx = transactions.value.find(t => t.id === transactionId)
      if (trx) {
        // Restore stock
        for (const item of trx.items) {
          await productApi.updateStock(item.product.id, item.quantity)
        }
      }
      
      const { error } = await supabase.from('transactions').delete().eq('id', transactionId)
      if (error) throw error
      
      transactions.value = transactions.value.filter(t => t.id !== transactionId)
    } catch (e: any) {
      console.error('Failed to delete transaction', e)
      alert('Gagal menghapus transaksi: ' + e.message)
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
