<script setup lang="ts">
import type { PurchaseRecord } from '@/types'

const props = defineProps<{
  purchase: PurchaseRecord
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" @click="emit('close')"></div>
    
    <div class="relative bg-white w-full max-w-lg max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-100 bg-white z-10 shrink-0">
        <div>
          <h2 class="font-bold text-lg text-neutral-800">Detail Pembelian</h2>
          <p class="text-xs text-neutral-400">{{ purchase.invoiceNo }}</p>
        </div>
        <button class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors" @click="emit('close')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex justify-between items-center mb-6 bg-neutral-50 p-4 rounded-xl">
          <div>
            <p class="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Tanggal</p>
            <p class="text-sm font-medium text-neutral-800">{{ formatDate(purchase.createdAt) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-neutral-500 font-bold uppercase tracking-wider mb-1">Total Biaya</p>
            <p class="text-lg font-bold text-primary-600">Rp {{ purchase.totalCost.toLocaleString('id-ID') }}</p>
          </div>
        </div>

        <h3 class="text-sm font-bold text-neutral-800 mb-3">Daftar Barang ({{ purchase.items.length }})</h3>
        
        <div class="space-y-2">
          <div 
            v-for="(item, idx) in purchase.items" 
            :key="idx"
            class="flex justify-between items-center p-3 border border-neutral-100 rounded-xl"
          >
            <div>
              <p class="font-bold text-sm text-neutral-800">{{ item.name }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-xs text-neutral-500">{{ item.quantity }} x Rp {{ item.buyPrice.toLocaleString('id-ID') }}</span>
                <span v-if="item.productId" class="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Terdaftar</span>
                <span v-else class="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Baru</span>
              </div>
            </div>
            <p class="font-bold text-sm text-neutral-800">
              Rp {{ (item.quantity * item.buyPrice).toLocaleString('id-ID') }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
