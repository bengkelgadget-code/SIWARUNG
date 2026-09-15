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

import { CapacitorUpdater } from '@capgo/capacitor-updater'
import { Capacitor } from '@capacitor/core'
import { Toast } from '@capacitor/toast'

const settingsStore = useSettingsStore()
const productStore = useProductStore()
const layoutStore = useLayoutStore()
const cartStore = useCartStore()
const purchaseStore = usePurchaseStore()

// Initialize background sync worker
useSync()

onMounted(async () => {
  settingsStore.loadSettings()
  productStore.fetchProducts()
  cartStore.loadTransactions()
  purchaseStore.loadPurchases()
  
  if (Capacitor.isNativePlatform()) {
    try {
      await CapacitorUpdater.notifyAppReady()
      
      const response = await fetch('https://bengkelgadget-code.github.io/SIWARUNG/version.json', { cache: 'no-store' })
      const data = await response.json()
      
      const currentVersion = localStorage.getItem('app_version')
      if (data.version && data.version !== currentVersion) {
        console.log('New update found:', data.version)
        await Toast.show({ text: 'Mengunduh pembaruan...', duration: 'short' })
        
        const version = await CapacitorUpdater.download({
          url: `https://bengkelgadget-code.github.io${data.url}`,
          version: data.version
        })
        
        localStorage.setItem('app_version', data.version)
        await Toast.show({ text: 'Memuat pembaruan...', duration: 'short' })
        await CapacitorUpdater.set(version)
      }
    } catch (err) {
      console.error('Failed to check for updates', err)
    }
  }
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
