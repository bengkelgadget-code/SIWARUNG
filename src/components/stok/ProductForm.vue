<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { geminiApi } from '@/lib/gemini'
import type { Product, AIProductLookup } from '@/types'

const props = defineProps<{
  product: Product | null
}>()

const emit = defineEmits<{
  (e: 'save', data: any): void
  (e: 'close'): void
}>()

// ─── Form Data ───
const form = ref({
  barcode: '',
  name: '',
  category: '',
  price: 0,
  stock: 0,
  unit: 'pcs',
  description: '',
  image: '',
})

const categories = ['Makanan', 'Minuman', 'Snack', 'Kebutuhan Rumah', 'Kesehatan', 'Lainnya']
const units = ['pcs', 'kg', 'liter', 'box', 'pack', 'botol', 'kaleng']

// ─── Scanner State ───
type ScanMode = 'none' | 'barcode' | 'ai'
const scanMode = ref<ScanMode>('none')
const scanner = ref<Html5Qrcode | null>(null)
const isScanning = ref(false)
const scanError = ref('')

// ─── AI Lookup State ───
const isLookingUp = ref(false)
const aiLoadingMsg = ref('AI sedang mencari informasi produk...')
const aiResult = ref<AIProductLookup | null>(null)
const showVerification = ref(false)
const aiLookupError = ref('')

// ─── Image State ───
const imagePreview = ref('')
const capturedImage = ref('')
const imageCapturePurpose = ref<'product' | 'ai'>('product')
const fileInput = ref<HTMLInputElement | null>(null)

onMounted(() => {
  if (props.product) {
    form.value = {
      barcode: props.product.barcode,
      name: props.product.name,
      category: props.product.category,
      price: props.product.price,
      stock: props.product.stock,
      unit: props.product.unit,
      description: props.product.description || '',
      image: props.product.image || '',
    }
    imagePreview.value = props.product.image || ''
  }
})

onBeforeUnmount(() => {
  stopAllScanners()
})

function stopAllScanners() {
  if (scanner.value && isScanning.value) {
    scanner.value.stop().then(() => scanner.value?.clear()).catch(() => {})
    isScanning.value = false
  }
}

// ─── Barcode Scanner ───
async function openBarcodeScanner() {
  scanMode.value = 'barcode'
  scanError.value = ''
  await nextTick()
  await startScan('form-barcode-scanner', handleBarcodeScanned)
}

async function handleBarcodeScanned(code: string) {
  form.value.barcode = code
  await stopScanner()
  scanMode.value = 'none'
}

// ─── AI Scanner ───
// ─── AI Scanner (via Image) ───
async function openAiScanner() {
  scanMode.value = 'none'
  aiLookupError.value = ''
  scanError.value = ''
  imageCapturePurpose.value = 'ai'
  openCamera()
}

async function processAiImage(base64Image: string) {
  isLookingUp.value = true
  aiLoadingMsg.value = 'AI sedang mencari informasi produk...'
  try {
    const data = await geminiApi.identifyProductFromImage(base64Image, (msg) => {
      aiLoadingMsg.value = msg
    })
    aiResult.value = data

    if (data.found) {
      showVerification.value = true
    } else {
      aiLookupError.value = 'AI tidak dapat mengenali produk dari foto ini.'
    }
  } catch (err: any) {
    aiLookupError.value = err.message || 'Gagal menghubungi server AI.'
  } finally {
    isLookingUp.value = false
  }
}

function confirmAiResult() {
  if (!aiResult.value) return
  const r = aiResult.value
  form.value.name = r.name || form.value.name
  form.value.category = r.category || form.value.category
  form.value.price = r.price || form.value.price
  form.value.unit = r.unit || form.value.unit
  form.value.description = r.description || form.value.description
  showVerification.value = false
  aiResult.value = null
}

function rejectAiResult() {
  showVerification.value = false
  aiResult.value = null
}

// ─── Native Image Capture ───
function openImageCapture() {
  imageCapturePurpose.value = 'product'
  openCamera()
}

function openCamera() {
  if (fileInput.value) {
    fileInput.value.setAttribute('capture', 'environment')
    fileInput.value.click()
  }
}

function openGallery() {
  if (fileInput.value) {
    fileInput.value.removeAttribute('capture')
    fileInput.value.click()
  }
}

function handleFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const base64Image = e.target?.result as string
    if (!base64Image) return

    capturedImage.value = base64Image
    
    if (imageCapturePurpose.value === 'product') {
      imagePreview.value = base64Image
      form.value.image = base64Image
    } else if (imageCapturePurpose.value === 'ai') {
      processAiImage(base64Image)
    }
  }
  reader.readAsDataURL(file)
}

function removeImage() {
  imagePreview.value = ''
  capturedImage.value = ''
  form.value.image = ''
}

// ─── Shared Scanner Logic ───
async function startScan(elementId: string, onScan: (code: string) => void) {
  try {
    scanner.value = new Html5Qrcode(elementId)
    await scanner.value.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 160 } },
      (decodedText) => {
        onScan(decodedText)
      },
      () => {}
    )
    isScanning.value = true
  } catch (err: any) {
    scanError.value = err.message || 'Gagal membuka kamera.'
  }
}

async function stopScanner() {
  if (scanner.value && isScanning.value) {
    try {
      await scanner.value.stop()
      scanner.value.clear()
    } catch {}
    isScanning.value = false
    scanner.value = null
  }
  scanMode.value = 'none'
}

function cancelScan() {
  stopScanner()
}

// ─── Submit ───
function handleSubmit() {
  emit('save', { ...form.value })
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[calc(100vh-2rem)]">

      <!-- Header (compact) -->
      <div class="px-5 py-3 border-b border-neutral-100 flex items-center justify-between shrink-0">
        <h3 class="text-base font-bold text-neutral-800">
          {{ product ? 'Edit Produk' : 'Tambah Produk Baru' }}
        </h3>
        <button class="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors" @click="emit('close')">
          <svg class="w-4 h-4 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Scrollable Body -->
      <div class="overflow-y-auto flex-1">
      
        <!-- Hidden Native Input -->
        <input type="file" accept="image/*" class="hidden" ref="fileInput" @change="handleFileSelected" />

        <!-- AI Scan Button -->
        <div class="px-5 pt-2 flex gap-2">
          <button
            type="button"
            class="flex-1 py-2 px-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white text-xs font-medium rounded-lg shadow-md flex items-center justify-center gap-1.5"
            @click="openAiScanner"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Scan AI (Kamera)</span>
          </button>
          
          <button
            type="button"
            class="flex-1 py-2 px-3 bg-white border border-primary-500 text-primary-600 hover:bg-primary-50 text-xs font-medium rounded-lg flex items-center justify-center gap-1.5"
            @click="imageCapturePurpose = 'ai'; openGallery()"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Scan AI (Galeri)</span>
          </button>
        </div>

        <!-- AI Scanner View -->
        <!-- AI Scanner View (Removed, now uses Image Capture) -->

        <!-- AI Loading -->
        <div v-if="isLookingUp" class="px-5 pt-3">
          <div class="p-2.5 bg-primary-50 rounded-lg flex items-center gap-2">
            <svg class="animate-spin w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span class="text-xs font-medium text-primary-700">{{ aiLoadingMsg }}</span>
          </div>
        </div>

        <!-- AI Lookup Error -->
        <div v-if="aiLookupError" class="px-5 pt-3">
          <div class="p-2.5 bg-amber-50 rounded-lg">
            <p class="text-xs text-amber-700">{{ aiLookupError }}</p>
          </div>
        </div>

        <!-- Scan Error -->
        <div v-if="scanError" class="px-5 pt-3">
          <div class="p-2.5 bg-red-50 rounded-lg">
            <p class="text-xs text-red-600">{{ scanError }}</p>
          </div>
        </div>

        <!-- Form -->
        <form class="px-5 py-2 space-y-2" @submit.prevent="handleSubmit">
          <div class="grid grid-cols-2 gap-2">

            <!-- Nama Produk -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Nama Produk</label>
              <input v-model="form.name" type="text" class="input-field" placeholder="Nama produk" required />
            </div>

            <!-- Kategori -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Kategori</label>
              <select v-model="form.category" class="input-field" required>
                <option value="" disabled>Pilih kategori</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- Satuan -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Satuan</label>
              <select v-model="form.unit" class="input-field" required>
                <option v-for="u in units" :key="u" :value="u">{{ u }}</option>
              </select>
            </div>

            <!-- Harga -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Harga (Rp)</label>
              <input v-model.number="form.price" type="number" class="input-field" placeholder="0" min="0" required />
            </div>

            <!-- Stok -->
            <div>
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Stok</label>
              <input v-model.number="form.stock" type="number" class="input-field" placeholder="0" min="0" required />
            </div>

            <!-- Barcode (below price, above description) -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Barcode</label>
              <div class="flex gap-2">
                <input
                  v-model="form.barcode"
                  type="text"
                  class="input-field flex-1 font-mono"
                  placeholder="8991234567890"
                  required
                />
                <button
                  type="button"
                  class="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg transition-all duration-200 flex items-center gap-1.5 text-neutral-600 hover:text-neutral-800 shrink-0"
                  @click="openBarcodeScanner"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                  <span class="text-xs font-medium">Scan</span>
                </button>
              </div>
            </div>

            <!-- Barcode Scanner View -->
            <div v-if="scanMode === 'barcode'" class="col-span-2">
              <div class="bg-neutral-900 rounded-lg overflow-hidden relative">
                <div id="form-barcode-scanner" class="w-full"></div>
                <div class="absolute inset-0 pointer-events-none border-2 border-primary-400/50 rounded-lg m-3"></div>
              </div>
              <div class="flex items-center justify-between mt-2">
                <p class="text-xs text-neutral-500">Arahkan kamera ke barcode...</p>
                <button type="button" class="btn-secondary text-xs px-2.5 py-1" @click="cancelScan">Batal</button>
              </div>
            </div>

            <!-- Deskripsi -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Deskripsi (opsional)</label>
              <textarea v-model="form.description" class="input-field" rows="1" placeholder="Deskripsi singkat..."></textarea>
            </div>

            <!-- Gambar Produk -->
            <div class="col-span-2">
              <label class="block text-xs font-medium text-neutral-600 mb-0.5">Gambar Produk</label>
              <div class="flex items-start gap-2.5">
                <!-- Image Preview -->
                <div v-if="imagePreview" class="relative w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 shrink-0">
                  <img :src="imagePreview" alt="Product" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    class="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] hover:bg-red-600"
                    @click="removeImage"
                  >
                    &times;
                  </button>
                </div>

                <!-- Upload/Capture Buttons -->
                <div class="flex flex-col gap-1.5 flex-1">
                  <div class="flex gap-2">
                    <button
                      type="button"
                      class="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 transition-colors flex items-center gap-1"
                      @click="imageCapturePurpose = 'product'; openCamera()"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Kamera
                    </button>

                    <button
                      type="button"
                      class="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 rounded-lg text-xs font-medium text-neutral-600 transition-colors flex items-center gap-1 cursor-pointer"
                      @click="imageCapturePurpose = 'product'; openGallery()"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload
                    </button>
                  </div>
                  <p class="text-[11px] text-neutral-400">Foto dari kamera atau upload dari perangkat</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2.5 pt-1">
            <button type="button" class="btn-secondary flex-1 text-sm py-2" @click="emit('close')">Batal</button>
            <button type="submit" class="btn-primary flex-1 text-sm py-2">
              {{ product ? 'Simpan Perubahan' : 'Tambah Produk' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- AI Verification Modal -->
    <div
      v-if="showVerification && aiResult"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div class="p-5 border-b border-neutral-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h4 class="text-lg font-bold text-neutral-800">AI Menemukan Produk</h4>
              <p class="text-xs text-neutral-400">
                Kepercayaan:
                <span
                  class="font-medium"
                  :class="{
                    'text-green-600': aiResult.confidence === 'high',
                    'text-amber-600': aiResult.confidence === 'medium',
                    'text-red-500': aiResult.confidence === 'low',
                  }"
                >{{ aiResult.confidence }}</span>
              </p>
            </div>
          </div>
        </div>

        <div class="p-5 space-y-3">
          <div class="p-3 bg-neutral-50 rounded-xl">
            <p class="text-xs text-neutral-400">Nama Produk</p>
            <p class="font-medium text-neutral-800">{{ aiResult.name || '-' }}</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 bg-neutral-50 rounded-xl">
              <p class="text-xs text-neutral-400">Kategori</p>
              <p class="font-medium text-neutral-800">{{ aiResult.category || '-' }}</p>
            </div>
            <div class="p-3 bg-neutral-50 rounded-xl">
              <p class="text-xs text-neutral-400">Satuan</p>
              <p class="font-medium text-neutral-800">{{ aiResult.unit || '-' }}</p>
            </div>
          </div>
          <div class="p-3 bg-neutral-50 rounded-xl">
            <p class="text-xs text-neutral-400">Estimasi Harga</p>
            <p class="font-bold text-primary-600">Rp {{ (aiResult.price || 0).toLocaleString('id-ID') }}</p>
          </div>
          <div class="p-3 bg-neutral-50 rounded-xl">
            <p class="text-xs text-neutral-400">Deskripsi</p>
            <p class="text-sm text-neutral-700">{{ aiResult.description || '-' }}</p>
          </div>
        </div>

        <div class="p-5 border-t border-neutral-100 flex gap-3">
          <button class="btn-secondary flex-1" @click="rejectAiResult">Tolak</button>
          <button class="btn-primary flex-1" @click="confirmAiResult">Ya, Gunakan</button>
        </div>
      </div>
    </div>
  </div>
</template>
