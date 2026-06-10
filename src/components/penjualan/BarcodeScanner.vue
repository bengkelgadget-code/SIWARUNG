<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useBarcodeScanner } from '@/composables/useBarcodeScanner'
import { useProductStore } from '@/stores/products'

const emit = defineEmits<{
  (e: 'scanned', product: any): void
  (e: 'close'): void
}>()

const { isScanning, error, startScanner, stopScanner } = useBarcodeScanner()
const productStore = useProductStore()
const scannerElementId = 'barcode-scanner'
const notFound = ref(false)

onMounted(async () => {
  await startScanner(scannerElementId, handleBarcodeScanned)
})

async function handleBarcodeScanned(code: string) {
  const product = await productStore.fetchByBarcode(code)
  if (product) {
    emit('scanned', product)
    notFound.value = false
  } else {
    notFound.value = true
    setTimeout(() => (notFound.value = false), 3000)
  }
}

function handleClose() {
  stopScanner()
  emit('close')
}
</script>

<template>
  <div class="card">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-bold text-neutral-800">Barcode Scanner</h3>
      <button class="btn-secondary text-sm px-3 py-1.5" @click="handleClose">
        Tutup
      </button>
    </div>

    <div class="relative">
      <div
        :id="scannerElementId"
        class="w-full max-w-md mx-auto rounded-xl overflow-hidden"
      ></div>

      <!-- Not found notification -->
      <div
        v-if="notFound"
        class="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg"
      >
        Barcode tidak ditemukan
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-3 p-3 bg-red-50 rounded-xl">
      <p class="text-sm text-red-600">{{ error }}</p>
    </div>

    <!-- Status -->
    <div v-if="isScanning" class="mt-3 text-center">
      <p class="text-sm text-neutral-500">Arahkan kamera ke barcode produk...</p>
    </div>
  </div>
</template>
