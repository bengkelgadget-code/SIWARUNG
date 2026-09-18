<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { geminiApi } from '@/lib/gemini'
import { useProductStore } from '@/stores/products'
import type { Product } from '@/types'

const emit = defineEmits<{
  (e: 'scanned', product: Product): void
  (e: 'close'): void
  (e: 'switch-to-barcode'): void
}>()

const productStore = useProductStore()
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const isCameraReady = ref(false)
const scanStatusMsg = ref('')
const errorMsg = ref('')
let stream: MediaStream | null = null
let autoScanInterval: any = null

const isAutoMode = ref(false) // toggle auto vs manual shutter

async function startCamera() {
  errorMsg.value = ''
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.setAttribute('playsinline', 'true') // iOS requirement
      videoRef.value.play()
      videoRef.value.onloadedmetadata = () => {
        isCameraReady.value = true
      }
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Gagal mengakses kamera. Periksa izin kamera HP Anda.'
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  isCameraReady.value = false
  if (autoScanInterval) {
    clearInterval(autoScanInterval)
  }
}

import { playBeep } from '@/lib/sound'

// State for queued items being processed
const queuedScans = ref(0)
const lastScannedImage = ref('')

async function captureAndScan() {
  if (!videoRef.value || !canvasRef.value || !isCameraReady.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  
  if (!video.videoWidth || !video.videoHeight) {
    errorMsg.value = 'Kamera sedang memuat, coba lagi...'
    return
  }

  // Scale down to max 512px
  const maxDim = 512
  let scale = 1
  if (video.videoWidth > maxDim || video.videoHeight > maxDim) {
    scale = Math.min(maxDim / video.videoWidth, maxDim / video.videoHeight)
  }
  
  canvas.width = Math.floor(video.videoWidth * scale)
  canvas.height = Math.floor(video.videoHeight * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  try {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  } catch (e: any) {
    errorMsg.value = 'Gagal menangkap gambar: ' + e.message
    return
  }
  
  const base64Image = canvas.toDataURL('image/jpeg', 0.6)
  lastScannedImage.value = base64Image

  // UI Feedback langsung (Instan)
  playBeep()
  queuedScans.value++
  scanStatusMsg.value = `Memproses ${queuedScans.value} antrean...`
  errorMsg.value = ''

  // Proses di background tanpa memblokir kamera
  processImageBackground(base64Image)
}

async function processImageBackground(base64Image: string) {
  try {
    const { found, product, confidenceScore } = await geminiApi.matchProductFromImage(
      base64Image, 
      productStore.products
    )

    if (found && product && confidenceScore >= 0.5) {
      scanStatusMsg.value = '✅ ' + product.name
      emit('scanned', product)
      setTimeout(() => {
        if (!isAutoMode.value && queuedScans.value === 0) scanStatusMsg.value = ''
      }, 1500)
    } else {
      errorMsg.value = 'Barang terakhir tidak dikenali.'
    }
  } catch (err: any) {
    errorMsg.value = err.message || 'Gagal memproses gambar.'
  } finally {
    queuedScans.value--
    if (queuedScans.value > 0) {
      scanStatusMsg.value = `Sisa ${queuedScans.value} antrean...`
    } else if (!isAutoMode.value && !errorMsg.value) {
      setTimeout(() => { scanStatusMsg.value = '' }, 2000)
    }
  }
}

function toggleAutoMode() {
  isAutoMode.value = !isAutoMode.value
  if (isAutoMode.value) {
    autoScanInterval = setInterval(() => {
      // Di mode auto, kita scan setiap 2 detik
      captureAndScan()
    }, 2000)
  } else {
    if (autoScanInterval) clearInterval(autoScanInterval)
  }
}

function handleClose() {
  stopCamera()
  emit('close')
}

onMounted(() => {
  startCamera()
})

onUnmounted(() => {
  stopCamera()
})
</script>

<template>
  <div class="card p-3 lg:p-4">
    <!-- Header -->
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <h3 class="text-lg font-bold text-neutral-800">Kamera Pintar AI</h3>
        <span class="bg-primary-100 text-primary-700 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">BETA</span>
      </div>
      <div class="flex items-center gap-2">
        <button class="text-xs text-neutral-500 underline decoration-dotted hover:text-primary-600" @click="emit('switch-to-barcode')">
          Gunakan Barcode Lama
        </button>
        <button class="btn-secondary text-xs px-2.5 py-1" @click="handleClose">
          Tutup
        </button>
      </div>
    </div>

    <!-- Viewfinder -->
    <div class="relative w-full max-w-md mx-auto aspect-[4/3] bg-black rounded-xl overflow-hidden shadow-inner">
      <video 
        ref="videoRef" 
        class="w-full h-full object-cover"
        muted
      ></video>
      <canvas ref="canvasRef" class="hidden"></canvas>

      <!-- Overlay Scanner Brackets -->
      <div v-if="isCameraReady" class="absolute inset-0 pointer-events-none p-6">
        <div class="w-full h-full border-2 border-white/30 rounded-lg relative">
          <div class="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
          <div class="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
          <div class="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
          <div class="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
        </div>
      </div>
      <!-- Scan Line Animation -->
      <div v-if="queuedScans > 0" class="absolute top-0 left-0 w-full h-1 bg-primary-500/80 shadow-[0_0_8px_theme(colors.primary.500)] animate-scan-line pointer-events-none"></div>

      <!-- Loading / Status Overlay -->
      <div v-if="queuedScans > 0 || scanStatusMsg" class="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-11/12 max-w-[280px]">
        <div class="bg-black/70 backdrop-blur text-white text-xs text-center py-2 px-3 rounded-full shadow-lg border border-white/10 truncate">
          {{ scanStatusMsg }}
        </div>
      </div>
      
      <!-- Thumbnail Overlay -->
      <transition name="fade">
        <div v-if="lastScannedImage" class="absolute bottom-4 left-4 w-12 h-12 rounded-lg border-2 border-primary-500 overflow-hidden shadow-lg shadow-black/50 bg-black">
          <img :src="lastScannedImage" class="w-full h-full object-cover opacity-80" />
          <div v-if="queuedScans > 0" class="absolute inset-0 flex items-center justify-center bg-black/40">
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Error Msg -->
    <div v-if="errorMsg" class="mt-2 text-center text-xs text-red-500 bg-red-50 py-1.5 rounded-lg">
      {{ errorMsg }}
    </div>

    <!-- Controls -->
    <div class="mt-4 flex flex-col items-center gap-3">
      <button 
        class="w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all active:scale-95 border-primary-200 bg-primary-500 hover:bg-primary-600 shadow-lg shadow-primary-500/30"
        :disabled="!isCameraReady"
        @click="captureAndScan"
      >
        <svg class="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      <div class="flex items-center gap-2">
        <span class="text-xs text-neutral-500 font-medium">Scan Otomatis</span>
        <button 
          class="w-10 h-5 rounded-full transition-colors relative"
          :class="isAutoMode ? 'bg-primary-500' : 'bg-neutral-300'"
          @click="toggleAutoMode"
        >
          <div 
            class="w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform"
            :class="isAutoMode ? 'left-5.5 translate-x-0' : 'left-0.5'"
          ></div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes scan-line {
  0% { transform: translateY(0); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(min(100vh, 480px)); opacity: 0; }
}
.animate-scan-line {
  animation: scan-line 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
</style>
