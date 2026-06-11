import { ref, onMounted, onUnmounted } from 'vue'
import { localDb } from '@/lib/localDb'
import { supabase } from '@/lib/supabase'
import { productApi } from '@/api'

const isSyncing = ref(false)
const syncError = ref<string | null>(null)
const queueCount = ref(0)
const isOnline = ref(navigator.onLine)

export function useSync() {
  async function updateQueueCount() {
    const queue = await localDb.getQueue()
    queueCount.value = queue.length
  }

  async function processQueue() {
    if (!isOnline.value || isSyncing.value) return
    
    const queue = await localDb.getQueue()
    if (queue.length === 0) return

    isSyncing.value = true
    syncError.value = null

    try {
      for (const item of queue) {
        try {
          if (item.type === 'ADD_TRANSACTION') {
            const trx = item.payload
            
            // Check if already synced (to prevent duplicate key & double stock reduction)
            const { data: existingTrx } = await supabase.from('transactions').select('id').eq('id', trx.id).maybeSingle()
            if (existingTrx) {
              await localDb.removeFromQueue(item.id)
              continue
            }

            const transactionData = {
              id: trx.id,
              items: trx.items,
              total: trx.total,
              payment: trx.payment,
              change: trx.change,
              createdAt: trx.createdAt
            }

            // 1. Insert to supabase
            const { error: insertError } = await supabase.from('transactions').insert([transactionData])
            if (insertError) throw insertError

            // 2. Reduce stock online
            for (const cartItem of trx.items) {
              await productApi.updateStock(cartItem.product.id, -cartItem.quantity)
            }
          } 
          else if (item.type === 'DELETE_TRANSACTION') {
            const { id, items } = item.payload
            
            // Check if already deleted
            const { data: existingTrx } = await supabase.from('transactions').select('id').eq('id', id).maybeSingle()
            if (!existingTrx) {
              await localDb.removeFromQueue(item.id)
              continue
            }

            const { error } = await supabase.from('transactions').delete().eq('id', id)
            if (error) throw error
            
            // Restore stock online
            for (const cartItem of items) {
              await productApi.updateStock(cartItem.product.id, cartItem.quantity)
            }
          }

          // Success, remove from queue
          await localDb.removeFromQueue(item.id)
        } catch (itemError: any) {
          console.error(`Failed to sync item ${item.id}:`, itemError)
          // Jika terjadi error dari API supabase yang bersifat permanen (misal RLS / invalid input),
          // kita keluarkan dari antrean agar tidak memblokir item lainnya.
          if (itemError?.code && ['42501', '23502', '23503', '42P01'].includes(itemError.code)) {
            console.error('Permanent error detected, removing from queue:', itemError.message)
            await localDb.removeFromQueue(item.id)
          }
        }
      }
    } catch (e: any) {
      syncError.value = e.message
    } finally {
      isSyncing.value = false
      await updateQueueCount()
    }
  }

  function handleOnline() {
    isOnline.value = true
    processQueue()
  }

  function handleOffline() {
    isOnline.value = false
  }

  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    updateQueueCount()
    
    // Periodically check queue
    setInterval(processQueue, 15000) // every 15s
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    isSyncing,
    syncError,
    queueCount,
    isOnline,
    processQueue,
    updateQueueCount
  }
}
