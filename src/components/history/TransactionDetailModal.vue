<script setup lang="ts">
import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import { usePrinter } from '@/composables/usePrinter'
import type { Transaction } from '@/types'

const props = defineProps<{
  transaction: Transaction
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'delete', id: string): void
}>()

const settingsStore = useSettingsStore()
const { isPrinting, error: printError, printReceipt } = usePrinter()

async function handlePrint() {
  await printReceipt(
    props.transaction,
    settingsStore.storeName,
    settingsStore.storeAddress
  )
}

function handleDelete() {
  if (confirm('Apakah Anda yakin ingin menghapus transaksi ini? Stok barang akan dikembalikan.')) {
    emit('delete', props.transaction.id)
  }
}

function formatDate(isoString: string) {
  const date = new Date(isoString)
  return date.toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" @click="$emit('close')"></div>
    
    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-100 shrink-0 bg-neutral-50">
        <div>
          <h2 class="font-bold text-neutral-800 text-lg">Detail Transaksi</h2>
          <p class="text-xs text-neutral-500 font-mono">{{ transaction.id }}</p>
        </div>
        <button class="p-1.5 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors" @click="$emit('close')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Info -->
        <div class="text-center pb-2 border-b border-dashed border-neutral-200">
          <p class="text-xs text-neutral-500">Tanggal Transaksi</p>
          <p class="font-medium text-sm text-neutral-800">{{ formatDate(transaction.createdAt || '') }}</p>
        </div>

        <!-- Items -->
        <div class="space-y-3">
          <h3 class="text-xs font-bold text-neutral-400 uppercase tracking-wider">Barang Pembelian</h3>
          <div 
            v-for="item in transaction.items" 
            :key="item.product.id"
            class="flex justify-between items-start text-sm"
          >
            <div class="flex-1 min-w-0 pr-2">
              <p class="font-medium text-neutral-800 truncate">{{ item.product.name }}</p>
              <p class="text-[10px] text-neutral-500">
                {{ item.quantity }} x Rp {{ item.product.price.toLocaleString('id-ID') }}
              </p>
            </div>
            <p class="font-bold text-neutral-700 shrink-0">
              Rp {{ item.subtotal.toLocaleString('id-ID') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Footer (Summary & Actions) -->
      <div class="p-4 border-t border-neutral-100 bg-neutral-50 shrink-0 space-y-3">
        <!-- Totals -->
        <div class="space-y-1">
          <div class="flex justify-between text-sm">
            <span class="text-neutral-500">Total Harga</span>
            <span class="font-bold text-neutral-800">Rp {{ transaction.total.toLocaleString('id-ID') }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-neutral-500">Tunai</span>
            <span class="font-bold text-neutral-800">Rp {{ transaction.payment.toLocaleString('id-ID') }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-neutral-500">Kembalian</span>
            <span class="font-bold text-primary-600">Rp {{ transaction.change.toLocaleString('id-ID') }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 pt-2">
          <button 
            class="btn-secondary flex-1 flex items-center justify-center gap-2"
            @click="handlePrint"
            :disabled="isPrinting"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span class="text-sm font-bold">{{ isPrinting ? 'Mencetak...' : 'Cetak Struk' }}</span>
          </button>
          <button 
            class="flex items-center justify-center p-3 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
            @click="handleDelete"
            title="Hapus Transaksi"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p v-if="printError" class="text-[10px] text-red-500 text-center">{{ printError }}</p>
      </div>
    </div>
  </div>
</template>
