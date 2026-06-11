import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import type { Transaction } from '@/types'

export function usePrinter() {
  const isPrinting = ref(false)
  const error = ref<string>('')

  // ESC/POS commands
  const ESC = '\x1B'
  const GS = '\x1D'
  const INIT = `${ESC}@`
  const ALIGN_CENTER = `${ESC}a\x01`
  const ALIGN_LEFT = `${ESC}a\x00`
  const BOLD_ON = `${ESC}E\x01`
  const BOLD_OFF = `${ESC}E\x00`
  const DOUBLE_HEIGHT = `${GS}!\x11`
  const NORMAL_SIZE = `${GS}!\x00`
  const CUT = `${GS}V\x00`
  const LINE_FEED = '\n'
  const SEPARATOR = '================================'

  function formatReceipt(transaction: Transaction, storeName: string, storeAddress: string): string {
    const date = new Date(transaction.createdAt)
    const dateStr = date.toLocaleDateString('id-ID')
    const timeStr = date.toLocaleTimeString('id-ID')

    let receipt = ''
    receipt += INIT
    receipt += ALIGN_CENTER
    receipt += DOUBLE_HEIGHT
    receipt += `${storeName}${LINE_FEED}`
    receipt += NORMAL_SIZE
    receipt += `${storeAddress}${LINE_FEED}`
    receipt += `${SEPARATOR}${LINE_FEED}`
    receipt += ALIGN_LEFT
    receipt += `No: ${transaction.id}${LINE_FEED}`
    receipt += `Tanggal: ${dateStr} ${timeStr}${LINE_FEED}`
    receipt += `${SEPARATOR}${LINE_FEED}`

    for (const item of transaction.items) {
      receipt += `${item.product.name}${LINE_FEED}`
      receipt += `  ${item.quantity} x Rp ${item.product.price.toLocaleString('id-ID')}`
      receipt += ` = Rp ${item.subtotal.toLocaleString('id-ID')}${LINE_FEED}`
    }

    receipt += `${SEPARATOR}${LINE_FEED}`
    receipt += ALIGN_LEFT
    receipt += BOLD_ON
    receipt += `TOTAL: Rp ${transaction.total.toLocaleString('id-ID')}${LINE_FEED}`
    receipt += BOLD_OFF
    receipt += `Bayar: Rp ${transaction.payment.toLocaleString('id-ID')}${LINE_FEED}`
    receipt += `Kembali: Rp ${transaction.change.toLocaleString('id-ID')}${LINE_FEED}`
    receipt += `${SEPARATOR}${LINE_FEED}`
    receipt += ALIGN_CENTER
    receipt += `Terima Kasih${LINE_FEED}`
    receipt += CUT

    return receipt
  }

  async function printReceipt(transaction: Transaction, storeName: string, storeAddress: string) {
    isPrinting.value = true
    error.value = ''

    try {
      const receiptData = formatReceipt(transaction, storeName, storeAddress)
      const encoder = new TextEncoder()
      const data = encoder.encode(receiptData)
      const chunkSize = 20

      if (Capacitor.isNativePlatform()) {
        // Native Android BLE
        const { useSettingsStore } = await import('@/stores/settings')
        const settingsStore = useSettingsStore()
        
        if (!settingsStore.printerDevice?.id) {
          throw new Error('Printer belum dikonfigurasi di Pengaturan.')
        }
        
        await BleClient.initialize()
        const deviceId = settingsStore.printerDevice.id
        
        await BleClient.connect(deviceId)

        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize)
          const dataView = new DataView(chunk.buffer, chunk.byteOffset, chunk.byteLength)
          await BleClient.write(
            deviceId,
            '000018f0-0000-1000-8000-00805f9b34fb',
            '00002af1-0000-1000-8000-00805f9b34fb',
            dataView
          )
        }
        // Tunggu sedikit agar buffer selesai
        await new Promise(resolve => setTimeout(resolve, 500))
        await BleClient.disconnect(deviceId)
      } else {
        // Web Bluetooth
        if (!('bluetooth' in navigator)) {
          throw new Error('Bluetooth tidak tersedia')
        }

        const device = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        })

        const server = await device.gatt.connect()
        const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb')
        const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb')

        for (let i = 0; i < data.length; i += chunkSize) {
          const chunk = data.slice(i, i + chunkSize)
          await characteristic.writeValue(chunk)
        }

        device.gatt.disconnect()
      }
    } catch (err: any) {
      error.value = err.message || 'Gagal mencetak struk'
    } finally {
      isPrinting.value = false
    }
  }

  return {
    isPrinting,
    error,
    formatReceipt,
    printReceipt,
  }
}
