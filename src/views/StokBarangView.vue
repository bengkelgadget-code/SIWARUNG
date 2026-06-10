<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/products'
import ProductForm from '@/components/stok/ProductForm.vue'
import ProductTable from '@/components/stok/ProductTable.vue'
import ProductDetailModal from '@/components/stok/ProductDetailModal.vue'
import BarcodeScanner from '@/components/penjualan/BarcodeScanner.vue'
import type { Product } from '@/types'

const productStore = useProductStore()
const showForm = ref(false)
const showDetail = ref(false)
const editProduct = ref<Product | null>(null)
const selectedProduct = ref<Product | null>(null)
const searchQuery = ref('')
const showScanner = ref(false)

const filteredProducts = computed(() => {
  if (!searchQuery.value) return productStore.products
  const query = searchQuery.value.toLowerCase()
  return productStore.products.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.barcode.includes(query) ||
      p.category.toLowerCase().includes(query)
  )
})

function openAddForm() {
  editProduct.value = null
  showForm.value = true
}

function openDetail(product: Product) {
  selectedProduct.value = product
  showDetail.value = true
}

function openEditForm(product: Product) {
  editProduct.value = product
  showForm.value = true
}

function handleSave(formData: any) {
  if (editProduct.value) {
    productStore.updateProduct(editProduct.value.id, formData)
  } else {
    productStore.addProduct(formData)
  }
  showForm.value = false
  editProduct.value = null
}

function handleDelete(product: Product) {
  if (confirm(`Hapus "${product.name}"?`)) {
    productStore.deleteProduct(product.id)
  }
}

function onBarcodeScanned(product: Product) {
  searchQuery.value = product.barcode
  showScanner.value = false
}
</script>

<template>
  <div class="space-y-4 -mt-2">

    <!-- Toolbar -->
    <div class="card px-4 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shadow-sm">
      <div class="flex-1 w-full max-w-md flex items-center gap-2">
        <div class="relative flex-1">
          <div class="absolute left-3 top-1/2 -translate-y-1/2">
            <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari produk / scan barcode..."
            class="input-field pl-9 pr-8 py-2 text-sm"
          />
          <!-- Clear button -->
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-neutral-200 rounded-full transition-colors"
            @click="searchQuery = ''"
          >
            <svg class="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Scanner Button -->
        <button
          class="relative group p-2.5 bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors shrink-0 glossy-effect shadow-md"
          title="Scan Barcode"
          @click="showScanner = !showScanner"
        >
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
        </button>
      </div>

      <button class="btn-primary py-2 px-4 flex items-center gap-2 text-sm shadow-sm shrink-0" @click="openAddForm">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Produk</span>
      </button>
    </div>

    <!-- Scanner Panel -->
    <div v-if="showScanner" class="card p-3 shadow-sm">
      <BarcodeScanner
        @scanned="onBarcodeScanned"
        @close="showScanner = false"
      />
    </div>

    <!-- Product Table -->
    <ProductTable
      :products="filteredProducts"
      @edit="openEditForm"
      @delete="handleDelete"
      @show-detail="openDetail"
    />

    <!-- Product Detail Modal -->
    <ProductDetailModal
      v-if="showDetail"
      :product="selectedProduct"
      @close="showDetail = false"
      @edit="openEditForm"
      @delete="handleDelete"
    />

    <!-- Product Form Modal -->
    <ProductForm
      v-if="showForm"
      :product="editProduct"
      @save="handleSave"
      @close="showForm = false"
    />
  </div>
</template>
