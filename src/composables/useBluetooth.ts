import { ref } from 'vue'
import type { BluetoothDevice } from '@/types'

export function useBluetooth() {
  const isSupported = ref('bluetooth' in navigator)
  const device = ref<BluetoothDevice | null>(null)
  const connecting = ref(false)
  const error = ref<string>('')

  async function scanAndConnect(): Promise<BluetoothDevice | null> {
    if (!isSupported.value) {
      error.value = 'Web Bluetooth API tidak didukung di browser ini. Gunakan Chrome/Edge.'
      return null
    }

    connecting.value = true
    error.value = ''

    try {
      const btDevice = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Generic printer service
        ],
      })

      device.value = {
        id: btDevice.id,
        name: btDevice.name || 'Unknown Device',
        connected: true,
      }

      btDevice.addEventListener('gattserverdisconnected', () => {
        if (device.value) {
          device.value.connected = false
        }
      })

      return device.value
    } catch (err: any) {
      error.value = err.message || 'Gagal menghubungkan perangkat'
      return null
    } finally {
      connecting.value = false
    }
  }

  function disconnect() {
    device.value = null
  }

  return {
    isSupported,
    device,
    connecting,
    error,
    scanAndConnect,
    disconnect,
  }
}
