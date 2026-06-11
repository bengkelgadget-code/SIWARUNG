import { ref } from 'vue'

export interface DialogOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}

const isOpen = ref(false)
const options = ref<DialogOptions>({ title: '', message: '' })
let resolvePromise: ((value: boolean) => void) | null = null

export function useDialog() {
  function confirm(opts: DialogOptions | string): Promise<boolean> {
    if (typeof opts === 'string') {
      options.value = { title: 'Konfirmasi', message: opts }
    } else {
      options.value = {
        title: opts.title || 'Konfirmasi',
        message: opts.message,
        confirmText: opts.confirmText || 'Ya',
        cancelText: opts.cancelText || 'Batal'
      }
    }
    
    isOpen.value = true
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  function onConfirm() {
    isOpen.value = false
    if (resolvePromise) resolvePromise(true)
  }

  function onCancel() {
    isOpen.value = false
    if (resolvePromise) resolvePromise(false)
  }

  return {
    isOpen,
    options,
    confirm,
    onConfirm,
    onCancel
  }
}
