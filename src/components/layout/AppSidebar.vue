<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { useLayoutStore } from '@/stores/layout'

const route = useRoute()
const router = useRouter()
const settingsStore = useSettingsStore()
const layoutStore = useLayoutStore()

const menuItems = [
  {
    name: 'Penjualan',
    path: '/',
    icon: 'cart',
  },
  {
    name: 'Stok Barang',
    path: '/stok-barang',
    icon: 'box',
  },
  {
    name: 'Belanja Barang',
    path: '/belanja',
    icon: 'truck',
  },
  {
    name: 'Riwayat Transaksi',
    path: '/riwayat',
    icon: 'history',
  },
  {
    name: 'Pengaturan',
    path: '/setting',
    icon: 'settings',
  },
]

function isActive(path: string): boolean {
  return route.path === path
}

function navigate(path: string) {
  router.push(path)
  layoutStore.closeSidebar()
}
</script>

<template>
  <aside class="w-64 bg-white border-r border-neutral-100 flex flex-col shadow-sm">
    <!-- Logo / Brand -->
    <div class="p-6 border-b border-neutral-100">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center shadow-md shadow-primary-200">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold text-neutral-800">{{ settingsStore.storeName || 'Warung POS' }}</h1>
          <p class="text-xs text-neutral-400">{{ settingsStore.storeAddress || 'Retail Sales System' }}</p>
        </div>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="flex-1 p-4 space-y-1.5">
      <button
        v-for="item in menuItems"
        :key="item.path"
        :class="isActive(item.path) ? 'sidebar-link-active' : 'sidebar-link'"
        @click="navigate(item.path)"
      >
        <!-- Cart Icon -->
        <svg v-if="item.icon === 'cart'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
        </svg>

        <!-- Box Icon -->
        <svg v-if="item.icon === 'box'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>

        <!-- Truck Icon -->
        <svg v-if="item.icon === 'truck'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14h.01M12 14h.01M16 14h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-3-3zM8 12v-2m4 2v-2m4 2v-2" />
        </svg>

        <!-- History Icon -->
        <svg v-if="item.icon === 'history'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>

        <!-- Settings Icon -->
        <svg v-if="item.icon === 'settings'" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>

        <span>{{ item.name }}</span>
      </button>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-neutral-100">
      <div class="flex items-center gap-3 px-4 py-3">
        <div class="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
          <span class="text-sm font-bold text-primary-600">W</span>
        </div>
        <div>
          <p class="text-sm font-medium text-neutral-700">Admin</p>
          <p class="text-xs text-neutral-400">Operator</p>
        </div>
      </div>
    </div>
  </aside>
</template>
