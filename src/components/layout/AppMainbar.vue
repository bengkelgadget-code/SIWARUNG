<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useLayoutStore } from '@/stores/layout'
import { useSync } from '@/composables/useSync'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const layoutStore = useLayoutStore()
const { isOnline, isSyncing, queueCount } = useSync()

const pageTitle = computed(() => (route.meta.title as string) || 'Dashboard')

const today = computed(() => {
  const date = new Date()
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})
</script>

<template>
  <header class="bg-[#e0e5ec] px-4 lg:px-6 py-4 rounded-b-3xl shadow-[0_10px_20px_rgba(0,0,0,0.05)] z-30 relative border-b border-white/50">
    <div class="flex items-center justify-between">
      <!-- Left Side -->
      <div class="flex items-center gap-3">
        <!-- Page Title -->
        <div>
          <h2 class="text-xl font-bold text-neutral-800">{{ pageTitle }}</h2>
          <p class="text-sm text-neutral-400 hidden sm:block">{{ today }}</p>
        </div>
      </div>

      <!-- Right Side -->
      <div class="flex items-center gap-2 sm:gap-4">
        <!-- Sync Indicator -->
        <div 
          class="w-4 h-4 rounded-full neumorphic flex items-center justify-center transition-all"
          title="Status Sinkronisasi"
        >
          <div 
            class="w-2 h-2 rounded-full" 
            :class="[
              !isOnline ? 'bg-red-500' : 
              isSyncing ? 'bg-yellow-500 animate-pulse' : 
              queueCount > 0 ? 'bg-yellow-500' : 'bg-green-500'
            ]"
          ></div>
        </div>

        <!-- Cart Badge -->
        <div class="relative">
          <button 
            class="p-2.5 rounded-full text-neutral-600 transition-all neumorphic hover:neumorphic-inset"
            @click="route.path !== '/' ? (router.push('/'), layoutStore.isCartModalOpen = true) : layoutStore.toggleCartModal()"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
          </button>
          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
          >
            {{ cartStore.totalItems }}
          </span>
        </div>



        <!-- Notification -->
        <button class="p-2.5 rounded-full text-neutral-600 transition-all neumorphic hover:neumorphic-inset">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
