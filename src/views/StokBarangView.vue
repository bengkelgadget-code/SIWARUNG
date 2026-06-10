<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductStore } from '@/stores/products'
import ProductForm from '@/components/stok/ProductForm.vue'
import ProductTable from '@/components/stok/ProductTable.vue'
import ProductDetailModal from '@/components/stok/ProductDetailModal.vue'
import type { Product } from '@/types'

const productStore = useProductStore()
const showForm = ref(false)
const showDetail = ref(false)
const editProduct = ref<Product | null>(null)
const selectedProduct = ref<Product | null>(null)
const searchQuery = ref('')

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
</script>

<template>
  <div class="space-y-6">

    <!-- Toolbar -->
    <div class="card flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
      <div class="relative flex-1 max-w-md">
        <div class="absolute left-3 top-1/2 -translate-y-1/2">
          <svg class="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Cari produk..."
          class="input-field pl-10"
        />
      </div>

      <button class="btn-primary flex items-center gap-2" @click="openAddForm">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        <span>Tambah Produk</span>
      </button>
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
