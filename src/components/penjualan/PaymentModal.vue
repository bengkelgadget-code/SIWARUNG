<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { usePrinter } from '@/composables/usePrinter'
import type { Transaction } from '@/types'

const props = defineProps<{
  total: number
  initialAmount?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const cartStore = useCartStore()
const settingsStore = useSettingsStore()
const { isPrinting, error: printError, printReceipt } = usePrinter()

const paymentAmount = ref<number>(0)
const transaction = ref<Transaction | null>(null)
const showSuccess = ref(false)

const change = computed(() => Math.max(0, paymentAmount.value - props.total))
const isPaymentValid = computed(() => paymentAmount.value >= props.total)

// Quick amount buttons
const quickAmounts = [50000, 100000, 150000, 200000]

function setAmount(amount: number) {
  paymentAmount.value = amount
}

async function processPayment() {
  if (!isPaymentValid.value) return
  transaction.value = await cartStore.checkout(paymentAmount.value)
  showSuccess.value = true
}

onMounted(() => {
  if (props.initialAmount && props.initialAmount >= props.total) {
    paymentAmount.value = props.initialAmount
    processPayment()
  }
})

async function handlePrint() {
  if (!transaction.value) return
  await printReceipt(
    transaction.value,
    settingsStore.storeName,
    settingsStore.storeAddress
  )
}

function closeAndReset() {
  showSuccess.value = false
  transaction.value = null
  paymentAmount.value = 0
  emit('close')
}
</script>

<template>
  <!-- Overlay -->
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden modal-content">
      <!-- Header -->
      <div class="p-6 border-b border-neutral-100">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-neutral-800">
            {{ showSuccess ? 'Transaksi Berhasil' : 'Pembayaran' }}
          </h3>
          <button class="p-2 hover:bg-neutral-100 rounded-xl transition-colors" @click="closeAndReset">
            <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="p-6">
        <!-- Success State -->
        <div v-if="showSuccess && transaction" class="text-center space-y-4">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-neutral-500">Total</p>
            <p class="text-2xl font-bold text-neutral-800">Rp {{ transaction.total.toLocaleString('id-ID') }}</p>
          </div>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div class="bg-neutral-50 p-3 rounded-xl">
              <p class="text-neutral-400">Bayar</p>
              <p class="font-bold text-neutral-700">Rp {{ transaction.payment.toLocaleString('id-ID') }}</p>
            </div>
            <div class="bg-primary-50 p-3 rounded-xl">
              <p class="text-primary-400">Kembali</p>
              <p class="font-bold text-primary-700">Rp {{ transaction.change.toLocaleString('id-ID') }}</p>
            </div>
          </div>

          <div class="flex gap-3">
            <button class="btn-secondary flex-1 flex items-center justify-center gap-2" @click="handlePrint">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>{{ isPrinting ? 'Mencetak...' : 'Cetak Struk' }}</span>
            </button>
            <button class="btn-primary flex-1" @click="closeAndReset">Selesai</button>
          </div>

          <p v-if="printError" class="text-sm text-red-500">{{ printError }}</p>
        </div>

        <!-- Payment Input -->
        <div v-else class="space-y-5">
          <!-- Total Display -->
          <div class="text-center">
            <p class="text-sm text-neutral-500">Total Pembayaran</p>
            <p class="text-3xl font-bold text-primary-600">Rp {{ total.toLocaleString('id-ID') }}</p>
          </div>

          <!-- Payment Input -->
          <div>
            <label class="block text-sm font-medium text-neutral-600 mb-2">Jumlah Bayar</label>
            <input
              v-model.number="paymentAmount"
              type="number"
              class="input-field text-2xl font-bold text-center"
              placeholder="0"
              min="0"
            />
          </div>

          <!-- Quick Amounts -->
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="amount in quickAmounts"
              :key="amount"
              class="py-2.5 bg-neutral-50 hover:bg-primary-50 border border-neutral-200 hover:border-primary-300 rounded-xl text-sm font-medium text-neutral-600 hover:text-primary-600 transition-all"
              @click="setAmount(amount)"
            >
              {{ (amount / 1000) }}K
            </button>
          </div>

          <!-- Change Display -->
          <div v-if="paymentAmount > 0" class="bg-neutral-50 p-4 rounded-xl text-center">
            <p class="text-sm text-neutral-500">Kembalian</p>
            <p class="text-xl font-bold" :class="isPaymentValid ? 'text-green-600' : 'text-red-500'">
              Rp {{ change.toLocaleString('id-ID') }}
            </p>
          </div>

          <!-- Pay Button -->
          <button
            class="btn-primary w-full py-3 text-lg"
            :disabled="!isPaymentValid"
            @click="processPayment"
          >
            Proses Pembayaran
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
