<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppMainbar from '@/components/layout/AppMainbar.vue'
import { useSettingsStore } from '@/stores/settings'
import { useProductStore } from '@/stores/products'
import { useLayoutStore } from '@/stores/layout'
import { useCartStore } from '@/stores/cart'
import { usePurchaseStore } from '@/stores/purchases'
import { useSync } from '@/composables/useSync'

const settingsStore = useSettingsStore()
const productStore = useProductStore()
const layoutStore = useLayoutStore()
const cartStore = useCartStore()
const purchaseStore = usePurchaseStore()

// Initialize background sync worker
useSync()

onMounted(() => {
  settingsStore.loadSettings()
  productStore.fetchProducts()
  cartStore.loadTransactions()
  purchaseStore.loadPurchases()
})
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-neutral-50 relative">
    <!-- Mobile Sidebar Overlay -->
    <div 
      v-if="layoutStore.isSidebarOpen" 
      class="fixed inset-0 bg-neutral-900/50 z-40 lg:hidden"
      @click="layoutStore.closeSidebar()"
    ></div>

    <!-- Sidebar -->
    <div 
      class="fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition duration-200 ease-in-out"
      :class="layoutStore.isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <AppSidebar class="h-full" />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden w-full min-w-0">
      <AppMainbar />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
