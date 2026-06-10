<script setup lang="ts">
import { ref, computed } from 'vue'
import { geminiApi } from '@/lib/gemini'
import { usePurchaseStore } from '@/stores/purchases'
import { useProductStore } from '@/stores/products'
import type { PurchaseItem, AIInvoiceResult } from '@/types'

const emit = defineEmits<{
  (e: 'close'): void
}>()

const purchaseStore = usePurchaseStore()
const productStore = useProductStore()

const step = ref<'upload' | 'processing' | 'review'>('upload')
const extractedData = ref<AIInvoiceResult | null>(null)
const editableItems = ref<PurchaseItem[]>([])
const invoiceNo = ref('')
const totalCost = ref(0)

async function handleFileSelected(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  step.value = 'processing'
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    const base64Image = e.target?.result as string
    if (!base64Image) {
      alert('Gagal membaca file gambar.')
      step.value = 'upload'
      return
    }

    try {
      const data = await geminiApi.scanInvoiceFromImage(base64Image)
      extractedData.value = data
      
      // Match products with database
      editableItems.value = data.items.map(item => {
        // Very basic matching by name
        const matchedProduct = productStore.products.find(p => p.name.toLowerCase().includes(item.name.toLowerCase()) || item.name.toLowerCase().includes(p.name.toLowerCase()))
        
        return {
          ...item,
          productId: matchedProduct?.id,
          sellPrice: matchedProduct?.price,
          isPriceWarning: matchedProduct ? item.buyPrice >= matchedProduct.price * 0.9 : false
        }
      })
      
      invoiceNo.value = data.invoiceNo
      totalCost.value = data.totalCost
      
      step.value = 'review'
    } catch (e: any) {
      const errorMsg = e.message || 'Gagal memproses nota'
      alert(errorMsg)
      step.value = 'upload'
    }
  }
  reader.readAsDataURL(file)
}

function removeItem(index: number) {
  editableItems.value.splice(index, 1)
}

function confirmRestock() {
  // Save to history and update stock
  purchaseStore.addPurchase(invoiceNo.value, editableItems.value, totalCost.value)
  emit('close')
}

// Helper to open file dialog easily
const fileInput = ref<HTMLInputElement | null>(null)
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
</script>

<template>
  <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" @click="emit('close')"></div>
    
    <div class="relative bg-white w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-neutral-100 bg-white z-10 shrink-0">
        <h2 class="font-bold text-lg text-neutral-800">Scan Nota Belanja</h2>
        <button class="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 transition-colors" @click="emit('close')">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content: Upload Step -->
      <div v-if="step === 'upload'" class="p-8 flex flex-col items-center justify-center flex-1">
        <div class="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
          <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-neutral-800 mb-2">Pindai Nota Pembelian</h3>
        <p class="text-neutral-500 text-center mb-8 max-w-sm">
          Foto atau unggah nota dari supplier. Sistem AI akan otomatis mengekstrak daftar barang dan menghitung stok.
        </p>
        
        <input type="file" accept="image/*" class="hidden" ref="fileInput" @change="handleFileSelected" />
        
        <div class="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
          <button class="btn-primary flex-1 flex items-center justify-center gap-2" @click="openCamera">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Buka Kamera
          </button>
          <button class="btn-secondary flex-1 flex items-center justify-center gap-2" @click="openGallery">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Galeri
          </button>
        </div>
      </div>

      <!-- Content: Processing Step -->
      <div v-else-if="step === 'processing'" class="p-8 flex flex-col items-center justify-center flex-1">
        <div class="relative w-20 h-20 mb-6">
          <div class="absolute inset-0 border-4 border-neutral-100 rounded-full"></div>
          <div class="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
          <svg class="w-8 h-8 text-primary-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-neutral-800 mb-2">Memproses Nota...</h3>
        <p class="text-neutral-500 text-center">AI sedang mengekstrak data dari gambar nota Anda.</p>
      </div>

      <!-- Content: Review Step -->
      <div v-else class="flex flex-col flex-1 overflow-hidden">
        <!-- Summary Info -->
        <div class="bg-primary-50 p-4 border-b border-primary-100 flex justify-between items-center shrink-0">
          <div>
            <p class="text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">No. Nota</p>
            <input v-model="invoiceNo" type="text" class="bg-transparent font-bold text-lg text-neutral-800 outline-none border-b border-primary-200 focus:border-primary-500 px-1 w-32" />
          </div>
          <div class="text-right">
            <p class="text-xs text-primary-600 font-bold uppercase tracking-wider mb-1">Total Biaya</p>
            <div class="flex items-center gap-1 font-bold text-lg text-neutral-800">
              Rp <input v-model.number="totalCost" type="number" class="bg-transparent outline-none border-b border-primary-200 focus:border-primary-500 px-1 w-28 text-right" />
            </div>
          </div>
        </div>
        
        <!-- Table List -->
        <div class="flex-1 overflow-y-auto p-4">
          <div class="bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-start gap-3 mb-4">
            <svg class="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p class="text-sm font-bold text-yellow-800">Periksa Ulang Data</p>
              <p class="text-xs text-yellow-700 mt-0.5">Pastikan AI membaca nota dengan benar. Barang yang ditandai kuning menandakan harga belinya hampir melebihi harga jual saat ini.</p>
            </div>
          </div>

          <div class="space-y-3">
            <div v-for="(item, idx) in editableItems" :key="idx" class="border border-neutral-200 rounded-xl p-3 flex flex-col gap-2 relative group" :class="{'bg-red-50 border-red-200': !item.productId}">
              <!-- Delete Button -->
              <button @click="removeItem(idx)" class="absolute -top-2 -right-2 w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div class="flex items-center gap-2">
                <div class="w-2 h-2 rounded-full" :class="item.productId ? 'bg-green-500' : 'bg-red-500'"></div>
                <input v-model="item.name" type="text" class="font-bold text-sm text-neutral-800 bg-transparent outline-none border-b border-transparent focus:border-neutral-300 flex-1" placeholder="Nama Barang" />
                <span v-if="!item.productId" class="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Item Baru</span>
              </div>
              
              <div class="flex gap-3">
                <div class="flex-1">
                  <label class="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Qty</label>
                  <input v-model.number="item.quantity" type="number" class="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm font-medium outline-none focus:border-primary-500" />
                </div>
                <div class="flex-[2]">
                  <label class="block text-[10px] text-neutral-400 font-bold uppercase mb-1 flex items-center gap-1">
                    Harga Beli / Item
                    <svg v-if="item.isPriceWarning" class="w-3 h-3 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </label>
                  <div class="relative">
                    <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-500">Rp</span>
                    <input v-model.number="item.buyPrice" type="number" class="w-full bg-neutral-50 border rounded-lg pl-7 pr-2 py-1 text-sm font-medium outline-none" :class="item.isPriceWarning ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-neutral-200 focus:border-primary-500'" />
                  </div>
                </div>
              </div>
            </div>
            
            <button @click="editableItems.push({name: '', quantity: 1, buyPrice: 0})" class="w-full py-3 border-2 border-dashed border-neutral-200 text-neutral-500 font-bold text-sm rounded-xl hover:border-primary-300 hover:text-primary-500 transition-colors flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Baris Manual
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="p-4 border-t border-neutral-100 bg-white shrink-0 flex gap-3">
          <button class="btn-secondary flex-1" @click="step = 'upload'">Batal</button>
          <button class="btn-primary flex-[2]" @click="confirmRestock" :disabled="editableItems.length === 0">
            Simpan & Tambah Stok
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
