<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import AutoFitText from '@/components/AutoFitText.vue'

const cartStore = useCartStore()

const emit = defineEmits<{
  (e: 'pay', amount: number): void
}>()

// Use a string to allow formatting
const paymentAmountStr = ref('')

const paymentAmountNum = computed(() => {
  const val = paymentAmountStr.value.replace(/\D/g, '')
  return val ? parseInt(val, 10) : 0
})

const diff = computed(() => paymentAmountNum.value - cartStore.totalPrice)

function onPaymentInput(e: Event) {
  const target = e.target as HTMLInputElement
  const val = target.value.replace(/\D/g, '')
  if (val) {
    paymentAmountStr.value = parseInt(val, 10).toLocaleString('id-ID')
  } else {
    paymentAmountStr.value = ''
  }
}

function handlePay() {
  emit('pay', paymentAmountNum.value)
}

function clearCart() {
  cartStore.clearCart()
  paymentAmountStr.value = ''
}
</script>

<template>
  <div class="flex flex-col gap-2 overflow-hidden h-full">
    <!-- Cart (top) -->
    <div class="flex-1 card overflow-y-auto p-2 min-h-0">
      <!-- Empty State -->
      <div v-if="cartStore.items.length === 0" class="text-center py-8">
        <svg class="w-12 h-12 text-neutral-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>
        <p class="text-neutral-400 text-sm font-medium">Keranjang kosong</p>
        <p class="text-xs text-neutral-300 mt-0.5">Klik barang untuk menambahkan</p>
      </div>

      <!-- Cart Items -->
      <div v-else class="space-y-2">
        <div
          v-for="item in cartStore.items"
          :key="item.product.id"
          class="bg-white rounded-lg border border-neutral-100 shadow-sm p-2 flex items-center gap-2"
        >
          <!-- Product info -->
          <div class="flex-1 min-w-0">
            <p class="font-medium text-neutral-800 text-xs truncate">{{ item.product.name }}</p>
            <p class="text-[10px] text-neutral-400">Rp {{ item.product.price.toLocaleString('id-ID') }} / {{ item.product.unit }}</p>
          </div>

          <!-- Qty controls -->
          <div class="flex items-center gap-1 shrink-0">
            <button
              class="w-5 h-5 rounded bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors text-neutral-600 text-[10px] font-bold"
              @click="cartStore.updateQuantity(item.product.id, item.quantity - 1)"
            >
              &minus;
            </button>
            <input
              type="number"
              :value="item.quantity"
              min="1"
              class="w-7 h-5 text-center text-xs font-medium bg-neutral-50 border border-neutral-200 rounded focus:outline-none focus:ring-1 focus:ring-primary-300 px-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              @input="cartStore.updateQuantity(item.product.id, Number(($event.target as HTMLInputElement).value) || 1)"
            />
            <button
              class="w-5 h-5 rounded bg-primary-100 hover:bg-primary-200 flex items-center justify-center transition-colors text-primary-600 text-[10px] font-bold"
              @click="cartStore.updateQuantity(item.product.id, item.quantity + 1)"
            >
              +
            </button>
          </div>

          <!-- Subtotal & remove -->
          <div class="flex items-center gap-2 shrink-0">
            <AutoFitText 
              :text="`Rp ${item.subtotal.toLocaleString('id-ID')}`"
              class="font-bold text-primary-600 text-xs w-[75px]"
            />
            <button
              class="p-0.5 hover:bg-red-50 rounded transition-colors text-neutral-300 hover:text-red-500 shrink-0"
              @click="cartStore.removeItem(item.product.id)"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary (bottom) -->
    <div class="card shrink-0 p-3">
      <div class="flex flex-col gap-3">
        <!-- Total -->
        <div class="flex justify-between items-center bg-primary-50 px-3 py-2.5 rounded-xl border border-primary-100/50">
          <span class="font-bold text-neutral-800 text-xl">Total</span>
          <span class="font-bold text-2xl text-primary-600 tracking-tight">
            Rp {{ cartStore.totalPrice.toLocaleString('id-ID') }}
          </span>
        </div>
        
        <!-- Input & Kembalian Grid -->
        <div class="grid grid-cols-2 gap-3 items-end">
          <!-- Input Bayar -->
          <div>
            <label class="block text-[11px] font-bold text-neutral-500 mb-1 uppercase tracking-wider">Jumlah Bayar</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-neutral-500">Rp</span>
              <input 
                v-model="paymentAmountStr" 
                @input="onPaymentInput"
                type="text" 
                class="input-field pl-9 py-2 text-lg font-bold w-full" 
                placeholder="0"
              />
            </div>
          </div>
          
          <!-- Kembalian / Kekurangan -->
          <div>
            <label class="block text-[11px] font-bold mb-1 uppercase tracking-wider" :class="paymentAmountStr && paymentAmountNum > 0 ? 'text-neutral-500' : 'text-transparent select-none'">
              {{ paymentAmountStr && paymentAmountNum > 0 ? (diff >= 0 ? 'Kembalian' : 'Kekurangan') : 'Kembalian' }}
            </label>
            <div class="bg-neutral-50 rounded-xl px-3 py-2 border border-neutral-100 flex items-center justify-center min-h-[46px]">
              <span v-if="paymentAmountStr && paymentAmountNum > 0" class="font-bold text-lg" :class="diff >= 0 ? 'text-green-600' : 'text-red-500'">
                Rp {{ Math.abs(diff).toLocaleString('id-ID') }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            class="btn-primary flex-1 flex items-center justify-center gap-2"
            :disabled="cartStore.items.length === 0 || diff < 0"
            @click="handlePay"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="text-base font-bold">Bayar</span>
          </button>

          <button
            v-if="cartStore.items.length > 0"
            class="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors shrink-0 flex items-center justify-center"
            @click="clearCart"
            title="Hapus Semua"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
