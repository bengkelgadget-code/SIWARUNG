<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import { useBluetooth } from '@/composables/useBluetooth'

const settingsStore = useSettingsStore()
const { isSupported, connecting, error, scanAndConnect } = useBluetooth()

const { storeName, storeAddress, geminiApiKey } = storeToRefs(settingsStore)
const saved = ref(false)

async function saveStoreSettings() {
  await settingsStore.updateStoreSettings({
    name: storeName.value,
    address: storeAddress.value,
    geminiApiKey: geminiApiKey.value,
  })
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}

async function handleConnectPrinter() {
  const device = await scanAndConnect()
  if (device && !error.value) {
    settingsStore.printerDevice = device
    settingsStore.saveSettings()
  }
}

function handleDisconnectPrinter() {
  settingsStore.disconnectPrinter()
}
</script>

<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <!-- Store Settings -->
    <div class="card">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-neutral-800">Pengaturan Toko</h3>
          <p class="text-sm text-neutral-400">Informasi toko yang ditampilkan pada struk</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-neutral-600 mb-1.5">Nama Toko</label>
          <input v-model="storeName" type="text" class="input-field" placeholder="Warung Retail" />
        </div>
        <div>
          <label class="block text-sm font-medium text-neutral-600 mb-1.5">Alamat Toko</label>
          <textarea v-model="storeAddress" class="input-field" rows="2" placeholder="Jl. Contoh No. 123, Kota"></textarea>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-primary" @click="saveStoreSettings">Simpan</button>
          <span v-if="saved" class="text-sm text-green-600 font-medium">Tersimpan!</span>
        </div>
      </div>
    </div>

    <!-- AI Settings -->
    <div class="card">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div class="flex items-center gap-3">
            <h3 class="text-lg font-bold text-neutral-800">Pengaturan AI</h3>
            <span v-if="settingsStore.geminiApiKey" class="px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-600">Terkoneksi</span>
            <span v-else class="px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-600">Belum Terkoneksi</span>
          </div>
          <p class="text-sm text-neutral-400">Konfigurasi Google Gemini API untuk fitur pintar</p>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-neutral-600 mb-1.5">Gemini API Key</label>
          <input v-model="geminiApiKey" type="password" class="input-field font-mono" placeholder="AIzaSy..." />
          <p class="text-xs text-neutral-400 mt-1.5">Dapatkan API Key secara gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary-600 hover:underline">Google AI Studio</a>.</p>
        </div>
        <div class="flex items-center gap-3">
          <button class="btn-primary bg-purple-500 hover:bg-purple-600" @click="saveStoreSettings">Simpan Konfigurasi</button>
        </div>
      </div>
    </div>

    <!-- Bluetooth Printer Settings -->
    <div class="card">
      <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.858 15.355-5.858 21.213 0" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-neutral-800">Printer Bluetooth</h3>
          <p class="text-sm text-neutral-400">Hubungkan printer thermal bluetooth untuk cetak struk</p>
        </div>
      </div>

      <!-- Bluetooth Status -->
      <div class="space-y-4">
        <!-- Support Check -->
        <div class="flex items-center gap-3 p-4 rounded-xl" :class="isSupported ? 'bg-green-50' : 'bg-red-50'">
          <div class="w-3 h-3 rounded-full" :class="isSupported ? 'bg-green-400' : 'bg-red-400'"></div>
          <p class="text-sm font-medium" :class="isSupported ? 'text-green-700' : 'text-red-700'">
            {{ isSupported ? 'Bluetooth didukung di browser ini' : 'Bluetooth TIDAK didukung. Gunakan Chrome/Edge di perangkat yang mendukung Bluetooth.' }}
          </p>
        </div>

        <!-- Connected Device -->
        <div v-if="settingsStore.printerDevice" class="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <p class="font-medium text-neutral-800">{{ settingsStore.printerDevice.name }}</p>
              <p class="text-xs text-green-500 font-medium">Terhubung</p>
            </div>
          </div>
          <button class="btn-danger text-sm px-3 py-1.5" @click="handleDisconnectPrinter">Putus</button>
        </div>

        <!-- Connect Button -->
        <button
          v-else
          class="btn-primary flex items-center gap-2"
          :disabled="!isSupported || connecting"
          @click="handleConnectPrinter"
        >
          <svg v-if="connecting" class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
          </svg>
          <span>{{ connecting ? 'Mencari printer...' : 'Hubungkan Printer Bluetooth' }}</span>
        </button>

        <!-- Error -->
        <div v-if="error" class="p-3 bg-red-50 rounded-xl">
          <p class="text-sm text-red-600">{{ error }}</p>
        </div>

        <!-- Info -->
        <div class="p-4 bg-neutral-50 rounded-xl">
          <p class="text-sm text-neutral-500 leading-relaxed">
            <span class="font-semibold text-neutral-700">Catatan:</span> Pastikan printer Bluetooth dalam keadaan hidup dan dalam jangkauan.
            Printer yang didukung adalah printer thermal dengan protokol ESC/POS (seperti Xprinter, Zjiang, dll).
          </p>
        </div>
      </div>
    </div>

    <!-- App Info -->
    <div class="card">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center">
          <svg class="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-bold text-neutral-800">Tentang Aplikasi</h3>
          <p class="text-sm text-neutral-400">Informasi versi dan teknologi</p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        <div class="p-3 bg-neutral-50 rounded-xl">
          <p class="text-neutral-400">Versi</p>
          <p class="font-medium text-neutral-700">1.0.0</p>
        </div>
        <div class="p-3 bg-neutral-50 rounded-xl">
          <p class="text-neutral-400">Framework</p>
          <p class="font-medium text-neutral-700">Vue 3 + Vite</p>
        </div>
        <div class="p-3 bg-neutral-50 rounded-xl">
          <p class="text-neutral-400">AI Engine</p>
          <p class="font-medium text-neutral-700">Google Gemini</p>
        </div>
        <div class="p-3 bg-neutral-50 rounded-xl">
          <p class="text-neutral-400">Backend</p>
          <p class="font-medium text-neutral-700">Node.js + Express</p>
        </div>
      </div>
    </div>
  </div>
</template>
