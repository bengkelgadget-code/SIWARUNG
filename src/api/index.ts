import type { Product } from '@/types'
import { supabase } from '@/lib/supabase'

const handleSupabase = async <T>(request: Promise<{ data: T | null; error: any }>) => {
  const { data, error } = await request
  if (error) throw new Error(error.message)
  return { data }
}

// Product API via Supabase
export const productApi = {
  getAll: () => handleSupabase(supabase.from('products').select('*').order('createdAt', { ascending: false })),

  getById: (id: string) => handleSupabase(supabase.from('products').select('*').eq('id', id).single()),

  getByBarcode: (barcode: string) => handleSupabase(supabase.from('products').select('*').eq('barcode', barcode).single()),

  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) =>
    handleSupabase(supabase.from('products').insert([product]).select().single()),

  update: (id: string, product: Partial<Product>) =>
    handleSupabase(supabase.from('products').update(product).eq('id', id).select().single()),

  delete: (id: string) => handleSupabase(supabase.from('products').delete().eq('id', id)),

  // Update stock is just a partial update in Supabase
  updateStock: async (id: string, quantity: number) => {
    // Get current stock
    const { data: current } = await supabase.from('products').select('stock').eq('id', id).single()
    const newStock = Math.max(0, (current?.stock || 0) + quantity)
    return handleSupabase(supabase.from('products').update({ stock: newStock }).eq('id', id).select().single())
  },
}
