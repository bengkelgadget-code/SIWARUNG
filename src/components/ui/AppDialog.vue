<script setup lang="ts">
import { useDialog } from '@/composables/useDialog'

const { isOpen, options, onConfirm, onCancel } = useDialog()
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm" @click="onCancel"></div>
    <div class="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all">
      <div class="p-5 border-b border-neutral-100">
        <h3 class="text-lg font-bold text-neutral-800">{{ options.title }}</h3>
      </div>
      <div class="p-5">
        <p class="text-sm text-neutral-600 leading-relaxed">{{ options.message }}</p>
      </div>
      <div class="p-5 bg-neutral-50 flex gap-3 border-t border-neutral-100">
        <button class="btn-secondary flex-1" @click="onCancel">
          {{ options.cancelText || 'Batal' }}
        </button>
        <button class="btn-primary flex-1" @click="onConfirm">
          {{ options.confirmText || 'Ya' }}
        </button>
      </div>
    </div>
  </div>
</template>
