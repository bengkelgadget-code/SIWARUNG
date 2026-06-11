<script setup lang="ts">
import { onMounted } from 'vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppMainbar from '@/components/layout/AppMainbar.vue'
import AppBottomNav from '@/components/layout/AppBottomNav.vue'
import AppSnackbar from '@/components/ui/AppSnackbar.vue'
import AppDialog from '@/components/ui/AppDialog.vue'
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
  <div class="flex h-screen overflow-hidden bg-[#e0e5ec] relative">
    <!-- Sidebar (Desktop Only) -->
    <div class="hidden lg:block fixed inset-y-0 left-0 z-50 lg:relative">
      <AppSidebar class="h-full" />
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden w-full min-w-0 pb-16 lg:pb-0">
      <AppMainbar />
      <main class="flex-1 overflow-y-auto p-4 lg:p-6">
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>

      <!-- Bottom Nav (Mobile Only) -->
      <AppBottomNav />
    </div>

    <!-- Global Snackbar & Dialog -->
    <AppSnackbar />
    <AppDialog />
  </div>
</template>
