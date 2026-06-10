import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CartItem, Product, Transaction } from '@/types'

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

  function checkout(payment: number): Transaction {
    const transaction: Transaction = {
      id: `TRX-${Date.now()}`,
      items: [...items.value],
      total: totalPrice.value,
      payment,
      change: payment - totalPrice.value,
      createdAt: new Date().toISOString(),
    }
    transactions.value.unshift(transaction)
    localStorage.setItem('transactions', JSON.stringify(transactions.value))
    clearCart()
    return transaction
  }

  function loadTransactions() {
    const stored = localStorage.getItem('transactions')
    if (stored) transactions.value = JSON.parse(stored)
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
  }
})
