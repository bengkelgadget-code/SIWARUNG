import { ref } from 'vue'

export type SnackbarType = 'success' | 'error' | 'info' | 'warning'

export interface SnackbarMessage {
  id: number
  text: string
  type: SnackbarType
}

const messages = ref<SnackbarMessage[]>([])
let nextId = 0

export function useSnackbar() {
  function show(text: string, type: SnackbarType = 'info', timeoutMs: number = 3000) {
    const id = nextId++
    messages.value.push({ id, text, type })
    
    setTimeout(() => {
      remove(id)
    }, timeoutMs)
  }

  function success(text: string, timeoutMs?: number) {
    show(text, 'success', timeoutMs)
  }

  function error(text: string, timeoutMs: number = 4000) {
    show(text, 'error', timeoutMs)
  }

  function info(text: string, timeoutMs?: number) {
    show(text, 'info', timeoutMs)
  }

  function warning(text: string, timeoutMs?: number) {
    show(text, 'warning', timeoutMs)
  }

  function remove(id: number) {
    messages.value = messages.value.filter(m => m.id !== id)
  }

  return {
    messages,
    show,
    success,
    error,
    info,
    warning,
    remove
  }
}
