import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { BluetoothDevice } from '@/types'

export const useSettingsStore = defineStore('settings', () => {
  const printerDevice = ref<BluetoothDevice | null>(null)
  const isBluetoothSupported = ref(false)
  const storeName = ref('Warung Retail')
  const storeAddress = ref('')
  const currency = ref('IDR')
  const geminiApiKey = ref('')

  function checkBluetoothSupport() {
    isBluetoothSupported.value = 'bluetooth' in navigator
  }

  async function connectPrinter() {
    if (!isBluetoothSupported.value) {
      throw new Error('Bluetooth tidak didukung di browser ini')
    }

    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      })

      printerDevice.value = {
        id: device.id,
        name: device.name || 'Unknown Printer',
        connected: true,
      }

      saveSettings()
      return printerDevice.value
    } catch (err: any) {
      throw new Error(err.message || 'Gagal terhubung ke printer')
    }
  }

  function disconnectPrinter() {
    printerDevice.value = null
    saveSettings()
  }

  function updateStoreSettings(settings: { name?: string; address?: string; geminiApiKey?: string }) {
    if (settings.name !== undefined) storeName.value = settings.name
    if (settings.address !== undefined) storeAddress.value = settings.address
    if (settings.geminiApiKey !== undefined) geminiApiKey.value = settings.geminiApiKey
    saveSettings()
  }

  function saveSettings() {
    localStorage.setItem(
      'settings',
      JSON.stringify({
        storeName: storeName.value,
        storeAddress: storeAddress.value,
        currency: currency.value,
        printerDevice: printerDevice.value,
        geminiApiKey: geminiApiKey.value,
      })
    )
  }

  function loadSettings() {
    const stored = localStorage.getItem('settings')
    if (stored) {
      const data = JSON.parse(stored)
      storeName.value = data.storeName || 'Warung Retail'
      storeAddress.value = data.storeAddress || ''
      currency.value = data.currency || 'IDR'
      printerDevice.value = data.printerDevice || null
      geminiApiKey.value = data.geminiApiKey || ''
    }
    checkBluetoothSupport()
  }

  return {
    printerDevice,
    isBluetoothSupported,
    storeName,
    storeAddress,
    currency,
    geminiApiKey,
    checkBluetoothSupport,
    connectPrinter,
    disconnectPrinter,
    updateStoreSettings,
    loadSettings,
  }
})
