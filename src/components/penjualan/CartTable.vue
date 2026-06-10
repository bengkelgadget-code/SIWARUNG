<script setup lang="ts">
import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()
</script>

<template>
  <div class="card">
    <h3 class="text-lg font-bold text-neutral-800 mb-4">Keranjang Belanja</h3>

    <!-- Empty State -->
    <div v-if="cartStore.items.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 text-neutral-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
      </svg>
      <p class="text-neutral-400 font-medium">Keranjang masih kosong</p>
      <p class="text-sm text-neutral-300 mt-1">Scan barcode atau cari produk untuk mulai belanja</p>
    </div>

    <!-- Cart Items -->
    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="text-left text-sm text-neutral-500 border-b border-neutral-100">
            <th class="pb-3 font-medium">Produk</th>
            <th class="pb-3 font-medium text-center">Harga</th>
            <th class="pb-3 font-medium text-center">Qty</th>
            <th class="pb-3 font-medium text-right">Subtotal</th>
            <th class="pb-3 font-medium text-center w-10"></th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in cartStore.items"
            :key="item.product.id"
            class="border-b border-neutral-50 last:border-0"
          >
            <td class="py-4">
              <p class="font-medium text-neutral-800">{{ item.product.name }}</p>
              <p class="text-xs text-neutral-400">{{ item.product.barcode }}</p>
            </td>
            <td class="py-4 text-center text-sm">
              Rp {{ item.product.price.toLocaleString('id-ID') }}
            </td>
            <td class="py-4">
              <div class="flex items-center justify-center gap-2">
                <button
                  class="w-8 h-8 rounded-lg bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors text-neutral-600"
                  @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
                >
                  -
                </button>
                <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                <button
                  class="w-8 h-8 rounded-lg bg-primary-50 hover:bg-primary-100 flex items-center justify-center transition-colors text-primary-600"
                  @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
                >
                  +
                </button>
              </div>
            </td>
            <td class="py-4 text-right font-medium">
              Rp {{ item.subtotal.toLocaleString('id-ID') }}
            </td>
            <td class="py-4 text-center">
              <button
                class="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-500"
                @click="cartStore.removeItem(item.product.id)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
