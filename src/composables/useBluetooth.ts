import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { BleClient } from '@capacitor-community/bluetooth-le'
import type { BluetoothDevice } from '@/types'

export function useBluetooth() {
  const isSupported = ref(Capacitor.isNativePlatform() || 'bluetooth' in navigator)
  const device = ref<BluetoothDevice | null>(null)
  const connecting = ref(false)
  const error = ref<string>('')

  async function scanAndConnect(): Promise<BluetoothDevice | null> {
    if (!isSupported.value) {
      error.value = 'Bluetooth tidak didukung di perangkat ini.'
      return null
    }

    connecting.value = true
    error.value = ''

    try {
      if (Capacitor.isNativePlatform()) {
        await BleClient.initialize()
        const btDevice = await BleClient.requestDevice({
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        })

        device.value = {
          id: btDevice.deviceId,
          name: btDevice.name || 'Printer Bluetooth',
          connected: true,
        }
      } else {
        const btDevice = await (navigator as any).bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
        })

        device.value = {
          id: btDevice.id,
          name: btDevice.name || 'Printer Bluetooth',
          connected: true,
        }

        btDevice.addEventListener('gattserverdisconnected', () => {
          if (device.value) {
            device.value.connected = false
          }
        })
      }

      return device.value
    } catch (err: any) {
      error.value = err.message || 'Gagal menghubungkan perangkat'
      return null
    } finally {
      connecting.value = false
    }
  }

  async function disconnect() {
    if (device.value) {
      if (Capacitor.isNativePlatform()) {
        try {
          await BleClient.disconnect(device.value.id)
        } catch(e) {
          console.error('Failed to disconnect BleClient', e)
        }
      }
      device.value = null
    }
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
