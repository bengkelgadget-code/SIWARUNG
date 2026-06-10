import { ref } from 'vue'
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

      const receiptData = formatReceipt(transaction, storeName, storeAddress)
      const encoder = new TextEncoder()
      const data = encoder.encode(receiptData)

      // Send data in chunks (BLE has MTU limit)
      const chunkSize = 20
      for (let i = 0; i < data.length; i += chunkSize) {
        const chunk = data.slice(i, i + chunkSize)
        await characteristic.writeValue(chunk)
      }

      device.gatt.disconnect()
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
