export interface Product {
  id: string
  barcode: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  description?: string
  image?: string
  createdAt: string
  updatedAt: string
}

export interface AIProductLookup {
  found: boolean
  name: string
  category: string
  price: number
  unit: string
  description: string
  confidence: string
}

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
}

export interface Transaction {
  id: string
  items: CartItem[]
  total: number
  payment: number
  change: number
  createdAt: string
}

export interface BluetoothDevice {
  id: string
  name: string
  connected: boolean
}

export interface AISearchResult {
  products: Product[]
  suggestion: string
}

export interface PurchaseItem {
  barcode?: string
  name: string
  quantity: number
  buyPrice: number
  sellPrice?: number
  productId?: string
}

export interface PurchaseRecord {
  id: string
  invoiceNo: string
  items: PurchaseItem[]
  totalCost: number
  createdAt: string
}

export interface AIInvoiceResult {
  invoiceNo: string
  items: PurchaseItem[]
  totalCost: number
}

