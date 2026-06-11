import { ref, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'

export function useBarcodeScanner() {
  const scanner = ref<Html5Qrcode | null>(null)
  const isScanning = ref(false)
  const lastScannedCode = ref<string>('')
  const error = ref<string>('')

  async function startScanner(
    elementId: string,
    onScanSuccess: (code: string) => void
  ) {
    try {
      error.value = ''
      scanner.value = new Html5Qrcode(elementId)

      await scanner.value.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
        },
        (decodedText) => {
          lastScannedCode.value = decodedText
          onScanSuccess(decodedText)
        },
        () => {
          // Ignore scan errors (no barcode detected in frame)
        }
      )

      isScanning.value = true
    } catch (err: any) {
      console.error('Scanner error:', err)
      if (err.name === 'NotAllowedError' || err.message?.toLowerCase().includes('permission')) {
        error.value = 'Izin kamera ditolak. Mohon izinkan akses kamera di pengaturan perangkat Anda.'
      } else if (err.name === 'NotFoundError' || err.message?.toLowerCase().includes('device not found')) {
        error.value = 'Kamera tidak ditemukan pada perangkat ini.'
      } else {
        error.value = err.message || 'Gagal memulai scanner'
      }
      isScanning.value = false
    }
  }

  async function stopScanner() {
    if (scanner.value && isScanning.value) {
      try {
        await scanner.value.stop()
        scanner.value.clear()
      } catch {
        // Ignore stop errors
      }
      isScanning.value = false
    }
  }

  onUnmounted(() => {
    stopScanner()
  })

  return {
    isScanning,
    lastScannedCode,
    error,
    startScanner,
    stopScanner,
  }
}
