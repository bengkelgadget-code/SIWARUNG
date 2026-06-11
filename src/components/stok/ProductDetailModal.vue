<script setup lang="ts">
import type { Product } from '@/types'

defineProps<{
  product: Product | null
}>()

defineEmits(['close', 'edit', 'delete'])
</script>

<template>
  <div v-if="product" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <!-- Overlay -->
    <div class="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" @click="$emit('close')"></div>

    <!-- Modal Content -->
    <div class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] modal-content">
      <!-- Handle for mobile swipe down (visual only) -->
      <div class="flex justify-center p-3 sm:hidden" @click="$emit('close')">
        <div class="w-12 h-1.5 bg-neutral-200 rounded-full"></div>
      </div>

      <div class="p-6 overflow-y-auto">
        <!-- Header / Close button -->
        <div class="absolute top-4 right-4 hidden sm:block">
          <button class="p-2 text-neutral-400 hover:bg-neutral-100 rounded-full transition-colors" @click="$emit('close')">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Product Image & Basic Info -->
        <div class="flex flex-col items-center text-center space-y-4 mb-6">
          <div class="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm border border-neutral-200 flex items-center justify-center shrink-0">
            <img v-if="product.image" :src="product.image" :alt="product.name" class="w-full h-full object-cover" />
            <svg v-else class="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 class="text-xl font-bold text-neutral-800">{{ product.name }}</h2>
            <p class="text-primary-600 font-medium bg-primary-50 px-2 py-0.5 rounded inline-block mt-1 text-sm">{{ product.category }}</p>
          </div>
        </div>

        <!-- Detail Grid -->
        <div class="bg-neutral-50 rounded-xl p-4 space-y-3">
          <div class="flex justify-between items-center py-1">
            <span class="text-sm text-neutral-500">Harga</span>
            <span class="font-bold text-lg text-neutral-800">Rp {{ product.price.toLocaleString('id-ID') }}</span>
          </div>
          <div class="h-px bg-neutral-200"></div>
          <div class="flex justify-between items-center py-1">
            <span class="text-sm text-neutral-500">Stok</span>
            <span class="font-medium text-neutral-800 flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="product.stock <= 5 ? 'bg-red-500' : 'bg-green-500'"></span>
              {{ product.stock }} {{ product.unit }}
            </span>
          </div>
          <div class="h-px bg-neutral-200"></div>
          <div class="flex justify-between items-center py-1">
            <span class="text-sm text-neutral-500">Barcode</span>
            <span class="font-mono text-sm bg-white px-2 py-1 rounded border border-neutral-200 text-neutral-700">
              {{ product.barcode || '-' }}
            </span>
          </div>
          <div v-if="product.description" class="h-px bg-neutral-200"></div>
          <div v-if="product.description" class="py-1">
            <span class="block text-sm text-neutral-500 mb-1">Deskripsi</span>
            <p class="text-sm text-neutral-700">{{ product.description }}</p>
          </div>
        </div>
        
        <!-- Actions -->
        <div class="grid grid-cols-2 gap-3 mt-6">
          <button 
            class="py-3 px-4 rounded-xl border-2 border-primary-500 text-primary-600 font-bold flex items-center justify-center gap-2 hover:bg-primary-50 transition-colors"
            @click="$emit('edit', product); $emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button 
            class="py-3 px-4 rounded-xl bg-red-50 text-red-600 font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
            @click="$emit('delete', product); $emit('close')"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  0% { transform: translateY(100%); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
</style>
