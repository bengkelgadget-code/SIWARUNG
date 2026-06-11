import { get, set, del, keys } from 'idb-keyval'

export const localDb = {
  // --- Products ---
  async setProducts(products: any[]) {
    await set('products', JSON.parse(JSON.stringify(products)))
  },
  async getProducts(): Promise<any[]> {
    const data = await get('products')
    return data || []
  },

  // --- Transactions ---
  async setTransactions(transactions: any[]) {
    await set('transactions', JSON.parse(JSON.stringify(transactions)))
  },
  async getTransactions(): Promise<any[]> {
    const data = await get('transactions')
    return data || []
  },

  // --- Sync Queue ---
  // Items in queue: { id: string, type: 'ADD_TRANSACTION' | 'DELETE_TRANSACTION' | 'ADD_PRODUCT' | 'UPDATE_PRODUCT' | 'DELETE_PRODUCT', payload: any, timestamp: number }
  async addToQueue(type: string, payload: any) {
    const queue = await this.getQueue()
    queue.push({
      id: `SYNC-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      type,
      payload: JSON.parse(JSON.stringify(payload)),
      timestamp: Date.now()
    })
    await set('sync_queue', queue)
  },
  async getQueue(): Promise<any[]> {
    const data = await get('sync_queue')
    return data || []
  },
  async setQueue(queue: any[]) {
    await set('sync_queue', queue)
  },
  async removeFromQueue(syncId: string) {
    const queue = await this.getQueue()
    const newQueue = queue.filter(item => item.id !== syncId)
    await set('sync_queue', newQueue)
  },
  
  // Clear all for testing or reset
  async clearAll() {
    await del('products')
    await del('transactions')
    await del('sync_queue')
  }
}
