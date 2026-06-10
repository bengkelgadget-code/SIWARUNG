<script setup lang="ts">
import { ref } from 'vue'
import { usePurchaseStore } from '@/stores/purchases'
import ScanNotaModal from '@/components/belanja/ScanNotaModal.vue'
import PurchaseDetailModal from '@/components/belanja/PurchaseDetailModal.vue'
import type { PurchaseRecord } from '@/types'

const purchaseStore = usePurchaseStore()

const showScanModal = ref(false)
const selectedPurchase = ref<PurchaseRecord | null>(null)

function openScanModal() {
  showScanModal.value = true
}

function openDetail(purchase: PurchaseRecord) {
  selectedPurchase.value = purchase
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="h-full flex flex-col gap-4">
    <!-- Header Action -->
    <div class="card shrink-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
      <div class="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold mb-1">Belanja Barang</h2>
          <p class="text-primary-100 text-sm">Scan nota dari supplier untuk tambah stok otomatis</p>
        </div>
        <button 
          class="bg-white text-primary-600 hover:bg-primary-50 px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 w-full md:w-auto justify-center"
          @click="openScanModal"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Scan Nota Baru
        </button>
      </div>
    </div>

    <!-- History List -->
    <div class="flex-1 card overflow-hidden flex flex-col p-0">
      <div class="p-4 border-b border-neutral-100 shrink-0">
        <h3 class="font-bold text-neutral-800">Riwayat Pembelian</h3>
      </div>
      
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="purchaseStore.purchases.length === 0" class="text-center py-12">
          <div class="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p class="text-neutral-500 font-medium">Belum ada riwayat pembelian</p>
          <p class="text-sm text-neutral-400 mt-1">Scan nota pertama Anda untuk mulai mencatat</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div 
            v-for="purchase in purchaseStore.purchases" 
            :key="purchase.id"
            class="bg-white border border-neutral-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            @click="openDetail(purchase)"
          >
            <div class="flex items-center gap-4">
              <div class="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p class="font-bold text-neutral-800 text-base mb-0.5">{{ purchase.invoiceNo }}</p>
                <p class="text-xs text-neutral-400">{{ formatDate(purchase.createdAt) }}</p>
              </div>
            </div>
            
            <div class="flex items-center gap-6 sm:gap-8 justify-between sm:justify-end border-t sm:border-t-0 border-neutral-50 pt-3 sm:pt-0">
              <div class="text-left sm:text-right">
                <p class="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-0.5">Total Item</p>
                <p class="text-sm font-medium text-neutral-700">{{ purchase.items.length }} Barang</p>
              </div>
              <div class="text-right">
                <p class="text-[10px] text-neutral-400 uppercase font-bold tracking-wider mb-0.5">Total Biaya</p>
                <p class="font-bold text-primary-600 text-base sm:text-lg">Rp {{ purchase.totalCost.toLocaleString('id-ID') }}</p>
              </div>
              <div class="w-8 h-8 rounded-lg bg-neutral-50 flex items-center justify-center text-neutral-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors hidden sm:flex shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <ScanNotaModal v-if="showScanModal" @close="showScanModal = false" />
    <PurchaseDetailModal 
      v-if="selectedPurchase" 
      :purchase="selectedPurchase" 
      @close="selectedPurchase = null" 
    />
  </div>
</template>
