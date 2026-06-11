<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import TransactionDetailModal from '@/components/history/TransactionDetailModal.vue'
import type { Transaction } from '@/types'

const cartStore = useCartStore()

const selectedTransaction = ref<Transaction | null>(null)
const searchQuery = ref('')

// Computed property to format date and filter
const filteredTransactions = computed(() => {
  let list = cartStore.transactions

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    list = list.filter(trx => 
      trx.id.toLowerCase().includes(query) ||
      (trx.createdAt && formatDate(trx.createdAt).toLowerCase().includes(query))
    )
  }

  return list
})

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

function openDetail(trx: Transaction) {
  selectedTransaction.value = trx
}

function closeDetail() {
  selectedTransaction.value = null
}

async function handleDeleteTransaction(id: string) {
  try {
    await cartStore.deleteTransaction(id)
    closeDetail()
  } catch (e) {
    // Error is handled in the store
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="card px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
      <div class="flex-1 w-full max-w-md relative">
        <div class="absolute left-3 top-1/2 -translate-y-1/2">
          <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari no nota atau tanggal..."
          class="input-field pl-9 pr-8 py-2 text-sm"
        />
        <!-- Clear button -->
        <button
          v-if="searchQuery"
          type="button"
          class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-200 rounded-full transition-colors"
          @click="searchQuery = ''"
        >
          <svg class="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="filteredTransactions.length === 0" class="card p-12 text-center text-neutral-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="font-medium text-neutral-500">Belum ada riwayat transaksi</p>
      <p class="text-sm mt-1">Data penjualan yang berhasil akan muncul di sini</p>
    </div>

    <!-- History List (Grid / Table layout based on screen size) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      <div 
        v-for="trx in filteredTransactions" 
        :key="trx.id"
        class="card p-4 hover:border-primary-300 transition-colors cursor-pointer group"
        @click="openDetail(trx)"
      >
        <div class="flex justify-between items-start mb-3">
          <div>
            <span class="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {{ trx.id }}
            </span>
            <p class="text-xs text-neutral-400 mt-1.5">{{ formatDate(trx.createdAt || '') }}</p>
          </div>
          <div class="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors">
            <svg class="w-4 h-4 text-neutral-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div class="flex items-end justify-between border-t border-neutral-100 pt-3">
          <div>
            <p class="text-[10px] text-neutral-500 uppercase font-bold tracking-wide">Total Item</p>
            <p class="font-medium text-neutral-700 text-sm mt-0.5">
              {{ trx.items.reduce((sum, item) => sum + item.quantity, 0) }} Pcs
            </p>
          </div>
          <div class="text-right">
            <p class="text-[10px] text-neutral-500 uppercase font-bold tracking-wide">Total Pembayaran</p>
            <p class="font-bold text-primary-600 text-lg mt-0.5">
              Rp {{ trx.total.toLocaleString('id-ID') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <transition name="modal">
      <TransactionDetailModal 
        v-if="selectedTransaction" 
        :transaction="selectedTransaction"
        @close="closeDetail"
        @delete="handleDeleteTransaction"
      />
    </transition>
  </div>
</template>
