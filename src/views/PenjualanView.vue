<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BarcodeScanner from '@/components/penjualan/BarcodeScanner.vue'
import CartPanel from '@/components/penjualan/CartPanel.vue'
import { useCartStore } from '@/stores/cart'
import { useProductStore } from '@/stores/products'
import { useLayoutStore } from '@/stores/layout'
import { useSettingsStore } from '@/stores/settings'
import { usePrinter } from '@/composables/usePrinter'
import { useSnackbar } from '@/composables/useSnackbar'
import { geminiApi } from '@/lib/gemini'
import type { Product } from '@/types'

const cartStore = useCartStore()
const productStore = useProductStore()
const layoutStore = useLayoutStore()
const settingsStore = useSettingsStore()
const { printReceipt } = usePrinter()
const { success, error: showError } = useSnackbar()

import { useDebouncedRef } from '@/composables/useDebouncedRef'
const searchQuery = useDebouncedRef('')
const searchResults = ref<Product[]>([])
const isSearching = ref(false)
const showScanner = ref(false)
const aiSuggestion = ref('')

// Real-time filter: as user types, filter the catalog instantly
const filteredProducts = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return productStore.products
  return productStore.products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  )
})

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  aiSuggestion.value = ''
}

async function handleEnter() {
  const q = searchQuery.value.trim()
  if (!q) return

  // Cek apakah input adalah barcode yang sama persis (dukungan Scanner Fisik)
  const exactMatch = productStore.products.find(p => p.barcode === q)
  if (exactMatch) {
    cartStore.addItem(exactMatch)
    clearSearch()
    return
  }

  // Jika bukan barcode persis, lakukan Pencarian AI
  await handleAiSearch()
}

async function handleAiSearch() {
  if (!searchQuery.value.trim()) return

  isSearching.value = true
  aiSuggestion.value = ''

  try {
    const { data } = await geminiApi.searchProducts(searchQuery.value, productStore.products)
    
    if (data.items && data.items.length > 0) {
      searchResults.value = data.items
        .map((item: any) => productStore.products.find(p => p.id === item.id))
        .filter((p: Product | undefined) => p !== undefined) as Product[]
      aiSuggestion.value = `Ditemukan ${searchResults.value.length} barang mirip.`
    } else {
      searchResults.value = []
      aiSuggestion.value = 'AI tidak menemukan barang yang cocok.'
    }
  } catch {
    const query = searchQuery.value.toLowerCase()
    searchResults.value = productStore.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query)
    )
  } finally {
    isSearching.value = false
  }
}

function addToCart(product: Product) {
  cartStore.addItem(product)
  searchResults.value = []
  // Keep searchQuery so user can continue adding from filtered results
}

function onBarcodeScanned(product: Product) {
  cartStore.addItem(product)
  showScanner.value = false
}

async function openPayment(amount: number) {
  if (cartStore.items.length === 0) return
  
  try {
    const transaction = await cartStore.checkout(amount)
    
    // Auto print if printer is connected
    if (settingsStore.printerDevice) {
      await printReceipt(transaction, settingsStore.storeName, settingsStore.storeAddress)
    }
    
    success(`Transaksi Berhasil! Kembalian: Rp ${transaction.change.toLocaleString('id-ID')}`, 5000)
    
    // Tutup modal mobile jika terbuka
    if (layoutStore.isCartModalOpen) {
      layoutStore.closeCartModal()
    }
  } catch (err: any) {
    showError('Gagal memproses transaksi: ' + err.message)
  }
}

function getAvailableStock(product: Product) {
  const cartItem = cartStore.items.find(item => item.product.id === product.id)
  if (cartItem) {
    return product.stock - cartItem.quantity
  }
  return product.stock
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">

    <!-- ═══ LEFT: Product Catalog Card ═══ -->
    <div class="lg:col-span-2 card flex flex-col overflow-hidden !p-0">
      <!-- Search Bar (inside catalog card) -->
      <div class="px-4 pt-4 pb-3 border-b border-neutral-100 shrink-0">
        <div class="flex items-center gap-2">
          <!-- Search Input -->
          <div class="flex-1 relative">
            <div class="absolute left-3 top-1/2 -translate-y-1/2">
              <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari barang... (cth: minuman dingin, snack)"
              class="input-field pl-9 pr-8 text-xs"
              @keyup.enter="handleEnter"
            />
            <!-- Clear button (X) -->
            <button
              v-if="searchQuery"
              type="button"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-200 rounded-full transition-colors"
              @click="clearSearch"
            >
              <svg class="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Scanner Icon Button (icon-only + tooltip) -->
          <button
            class="relative group p-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shrink-0 glossy-effect shadow-md"
            title="Scan Barcode"
            @click="showScanner = !showScanner"
          >
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span class="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Scan Barcode
            </span>
          </button>
        </div>

        <!-- AI Suggestion -->
        <div v-if="aiSuggestion" class="mt-2 p-2 bg-primary-50 rounded-lg">
          <p class="text-xs text-primary-700">
            <span class="font-semibold">AI:</span> {{ aiSuggestion }}
          </p>
        </div>

        <!-- Loading -->
        <div v-if="isSearching" class="mt-2 text-center py-2">
          <div class="inline-flex items-center gap-2 text-neutral-500">
            <svg class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span class="text-xs">Mencari dengan AI...</span>
          </div>
        </div>
      </div>

      <!-- Barcode Scanner (inline) -->
      <div v-if="showScanner" class="border-b border-neutral-100 shrink-0">
        <BarcodeScanner
          @scanned="onBarcodeScanned"
          @close="showScanner = false"
        />
      </div>

      <!-- Search Results / Product Catalog -->
      <div class="flex-1 overflow-y-auto p-4">
        <!-- Search Results -->
        <div v-if="searchResults.length > 0" class="space-y-2">
          <p class="text-xs font-medium text-neutral-500 mb-2">Hasil Pencarian ({{ searchResults.length }})</p>
          <div
            v-for="product in searchResults"
            :key="product.id"
            class="flex items-center justify-between p-3 bg-white shadow-sm hover:shadow-md rounded-xl transition-all cursor-pointer border-2 border-neutral-100 hover:border-primary-200"
            @click="addToCart(product)"
          >
            <div class="min-w-0">
              <p class="font-medium text-neutral-800 text-sm truncate">{{ product.name }}</p>
              <p class="text-xs text-neutral-400">{{ product.category }} | {{ product.barcode }}</p>
            </div>
            <div class="text-right shrink-0 ml-3">
              <p class="font-bold text-primary-600 text-base">{{ product.price.toLocaleString('id-ID') }}</p>
              <p class="text-[10px] text-neutral-400" :class="getAvailableStock(product) <= 5 ? 'text-red-500' : ''">Stok: {{ getAvailableStock(product) }}</p>
            </div>
          </div>
        </div>

        <!-- Full Catalog (filtered in real-time) -->
        <div v-else>
          <div class="flex items-center justify-between mb-3">
            <p class="text-xs font-medium text-neutral-500">
              <span v-if="searchQuery.trim()">Hasil Filter ({{ filteredProducts.length }})</span>
              <span v-else>Katalog Barang ({{ productStore.products.length }})</span>
            </p>
          </div>

          <!-- No results -->
          <div v-if="filteredProducts.length === 0" class="text-center py-10">
            <svg class="w-10 h-10 text-neutral-200 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p class="text-neutral-400 text-sm font-medium">Produk tidak ditemukan</p>
            <p class="text-xs text-neutral-300 mt-0.5">Coba kata kunci lain</p>
          </div>

          <div v-else class="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div
              v-for="product in filteredProducts"
              :key="product.id"
              class="p-3 bg-white shadow-sm hover:shadow-md rounded-xl transition-all cursor-pointer border-2 border-neutral-100 hover:border-primary-200"
              @click="addToCart(product)"
            >
              <div class="w-full aspect-square bg-neutral-200 rounded-md mb-2 flex items-center justify-center overflow-hidden">
                <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
                <svg v-else class="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <p class="font-medium text-neutral-800 text-xs truncate">{{ product.name }}</p>
              <p class="text-[10px] text-neutral-400 truncate">{{ product.category }}</p>
              <p class="font-bold text-primary-600 text-sm mt-1">{{ product.price.toLocaleString('id-ID') }}</p>
              <p class="text-[9px] mt-0.5" :class="getAvailableStock(product) <= 5 ? 'text-red-500' : 'text-neutral-400'">
                Stok: {{ getAvailableStock(product) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══ RIGHT: Cart + Summary (Desktop) ═══ -->
    <div class="hidden lg:flex flex-col gap-4 overflow-hidden h-full">
      <CartPanel @pay="openPayment" />
    </div>

    <!-- Mobile Cart Modal -->
    <transition name="modal">
      <div 
        v-if="layoutStore.isCartModalOpen"
        class="fixed inset-0 z-50 flex justify-center items-center p-4 sm:p-6 lg:hidden"
      >
        <div class="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" @click="layoutStore.closeCartModal()"></div>
        <div class="relative w-full max-w-lg max-h-[90vh] bg-neutral-50 rounded-2xl shadow-2xl flex flex-col transform transition-all duration-300 overflow-hidden modal-content">
          <!-- Header -->
          <div class="flex items-center justify-between py-2 px-4 bg-white border-b border-neutral-100 shrink-0 z-10">
            <h2 class="font-bold text-base text-neutral-800">Keranjang</h2>
            <button class="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors" @click="layoutStore.closeCartModal()">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <!-- Content -->
          <div class="flex-1 overflow-hidden p-2 min-h-0 flex flex-col">
            <CartPanel @pay="openPayment" ref="cartPanelMobileRef" class="flex-1 min-h-0" />
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>
