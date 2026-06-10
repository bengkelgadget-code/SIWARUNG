<script setup lang="ts">
import { ref } from 'vue'
import type { Product } from '@/types'

defineProps<{
  products: Product[]
}>()

const emit = defineEmits<{
  (e: 'edit', product: Product): void
  (e: 'delete', product: Product): void
  (e: 'show-detail', product: Product): void
}>()

// Swipe logic state
const swipedProductId = ref<string | number | null>(null)
let touchStartX = 0

function onTouchStart(e: TouchEvent, productId: string | number) {
  touchStartX = e.touches[0].clientX
}

function onTouchEnd(e: TouchEvent, productId: string | number) {
  const touchEndX = e.changedTouches[0].clientX
  const diffX = touchStartX - touchEndX

  // Swipe left detection
  if (diffX > 40) {
    swipedProductId.value = productId
  } 
  // Swipe right detection
  else if (diffX < -40) {
    if (swipedProductId.value === productId) {
      swipedProductId.value = null
    }
  }
}

function handleCardClick(product: Product) {
  // If card is swiped, clicking it will just reset the swipe.
  // Otherwise, open detail modal.
  if (swipedProductId.value === product.id) {
    swipedProductId.value = null
  } else {
    emit('show-detail', product)
  }
}
</script>

<template>
  <div>
    <!-- Desktop Table (hidden on mobile) -->
    <div class="hidden md:block card p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-primary-500 text-left text-sm text-white font-bold glossy-effect">
              <th class="px-6 py-4 w-16 rounded-tl-lg">Foto</th>
              <th class="px-6 py-4">Barcode</th>
              <th class="px-6 py-4">Nama Produk</th>
              <th class="px-6 py-4 text-center">Kategori</th>
              <th class="px-6 py-4 text-center">Harga</th>
              <th class="px-6 py-4 text-center">Stok</th>
              <th class="px-6 py-4 text-center">Satuan</th>
              <th class="px-6 py-4 text-center rounded-tr-lg">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-if="products.length === 0"
              class="text-center"
            >
              <td colspan="8" class="px-6 py-12">
                <div class="text-neutral-400">
                  <svg class="w-12 h-12 mx-auto mb-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <p class="font-medium">Belum ada produk</p>
                  <p class="text-sm mt-1">Klik "Tambah Produk" untuk menambahkan</p>
                </div>
              </td>
            </tr>

            <tr
              v-for="product in products"
              :key="product.id"
              class="border-t border-neutral-50 hover:bg-neutral-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div v-if="product.image" class="w-10 h-10 rounded-lg overflow-hidden border border-neutral-200">
                  <img :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
                </div>
                <div v-else class="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center">
                  <svg class="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="text-sm font-mono bg-neutral-100 px-2 py-1 rounded-lg text-neutral-600">
                  {{ product.barcode }}
                </span>
              </td>
              <td class="px-6 py-4">
                <p class="font-medium text-neutral-800">{{ product.name }}</p>
                <p class="text-xs text-neutral-400 mt-0.5">{{ product.description || '-' }}</p>
              </td>
              <td class="px-6 py-4 text-center">
                <span class="text-sm bg-primary-50 text-primary-600 px-2.5 py-1 rounded-lg font-medium">
                  {{ product.category }}
                </span>
              </td>
              <td class="px-6 py-4 text-center font-bold text-base text-primary-600">
                {{ product.price.toLocaleString('id-ID') }}
              </td>
              <td class="px-6 py-4 text-center">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-medium"
                  :class="product.stock <= 5 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'"
                >
                  {{ product.stock }}
                </span>
              </td>
              <td class="px-6 py-4 text-center text-sm text-neutral-500">
                {{ product.unit }}
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                  <button
                    class="p-2 hover:bg-primary-50 rounded-lg transition-colors text-neutral-400 hover:text-primary-600"
                    @click="$emit('edit', product)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    class="p-2 hover:bg-red-50 rounded-lg transition-colors text-neutral-400 hover:text-red-500"
                    @click="$emit('delete', product)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile List (hidden on desktop) -->
    <div class="md:hidden space-y-3">
      <!-- Empty State -->
      <div v-if="products.length === 0" class="text-center py-12 bg-white rounded-xl border border-neutral-100">
        <div class="text-neutral-400">
          <svg class="w-12 h-12 mx-auto mb-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <p class="font-medium">Belum ada produk</p>
          <p class="text-xs mt-1">Klik "Tambah Produk" untuk menambahkan</p>
        </div>
      </div>

      <!-- Product Cards -->
      <div 
        v-for="product in products" 
        :key="product.id"
        class="relative overflow-hidden bg-white rounded-xl shadow-sm border border-neutral-100"
      >
        <!-- Action Buttons (Hidden underneath on the right) -->
        <div class="absolute inset-y-0 right-0 flex items-center bg-neutral-50 px-3 gap-2 w-[120px] justify-end border-l border-neutral-100">
          <button 
            class="w-10 h-10 bg-white text-primary-600 rounded-lg shadow-sm flex items-center justify-center border border-neutral-100" 
            @click="$emit('edit', product); swipedProductId = null"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button 
            class="w-10 h-10 bg-red-50 text-red-600 rounded-lg shadow-sm flex items-center justify-center border border-red-100" 
            @click="$emit('delete', product); swipedProductId = null"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        <!-- Front Card (Swipeable) -->
        <div 
          class="relative flex items-center p-3 bg-white transition-transform duration-300 ease-out z-10 cursor-pointer touch-pan-y"
          :style="{ transform: swipedProductId === product.id ? 'translateX(-120px)' : 'translateX(0)' }"
          @touchstart="onTouchStart($event, product.id)"
          @touchend="onTouchEnd($event, product.id)"
          @click="handleCardClick(product)"
        >
          <!-- Photo -->
          <div class="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center">
            <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
            <svg v-else class="w-6 h-6 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <!-- Info -->
          <div class="ml-3 flex-1 min-w-0">
            <p class="font-bold text-neutral-800 text-sm truncate">{{ product.name }}</p>
            <p class="text-[10px] text-neutral-400 truncate mt-0.5" :class="product.stock <= 5 ? 'text-red-500 font-medium' : ''">Stok: {{ product.stock }}</p>
          </div>
          <!-- Price -->
          <div class="shrink-0 text-right ml-2">
            <p class="font-bold text-primary-600 text-base">{{ product.price.toLocaleString('id-ID') }}</p>
            <p class="text-[9px] text-neutral-400 mt-1">Geser ke kiri >></p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Prevent horizontal scrolling while dragging */
.touch-pan-y {
  touch-action: pan-y;
}
</style>
