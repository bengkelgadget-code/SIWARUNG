<script setup lang="ts">
import { useSnackbar } from '@/composables/useSnackbar'

const { messages, remove } = useSnackbar()

function getIcon(type: string) {
  switch (type) {
    case 'success':
      return 'M5 13l4 4L19 7' // check
    case 'error':
      return 'M6 18L18 6M6 6l12 12' // x
    case 'warning':
      return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' // exclamation-triangle
    default:
      return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' // info-circle
  }
}

function getBgClass(type: string) {
  switch (type) {
    case 'success': return 'bg-green-500'
    case 'error': return 'bg-red-500'
    case 'warning': return 'bg-amber-500'
    default: return 'bg-blue-500'
  }
}
</script>

<template>
  <div class="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-[90%] max-w-sm">
    <TransitionGroup name="snackbar">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl shadow-black/10 text-white backdrop-blur-md transform transition-all duration-300"
        :class="getBgClass(msg.type)"
      >
        <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="getIcon(msg.type)" />
        </svg>
        <p class="text-sm font-medium flex-1">{{ msg.text }}</p>
        <button 
          class="p-1 hover:bg-white/20 rounded-lg transition-colors shrink-0"
          @click="remove(msg.id)"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.snackbar-enter-active,
.snackbar-leave-active {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.snackbar-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
.snackbar-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.95);
}
</style>
