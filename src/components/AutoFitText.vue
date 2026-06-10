<script setup lang="ts">
import { ref, onMounted, watch, nextTick, onBeforeUnmount } from 'vue'

const props = defineProps<{
  text: string
}>()

const containerRef = ref<HTMLElement | null>(null)
const textRef = ref<HTMLElement | null>(null)
const scale = ref(1)
let resizeObserver: ResizeObserver | null = null

const adjustSize = async () => {
  // Reset
  scale.value = 1
  await nextTick()
  
  if (containerRef.value && textRef.value) {
    const containerWidth = containerRef.value.clientWidth
    const textWidth = textRef.value.scrollWidth
    
    if (textWidth > containerWidth && containerWidth > 0) {
      // Shrink down
      scale.value = containerWidth / textWidth
    }
  }
}

onMounted(() => {
  adjustSize()
  if (containerRef.value) {
    resizeObserver = new ResizeObserver(adjustSize)
    resizeObserver.observe(containerRef.value)
    if (textRef.value) {
      resizeObserver.observe(textRef.value)
    }
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

watch(() => props.text, adjustSize)
</script>

<template>
  <div ref="containerRef" class="w-full overflow-hidden flex flex-col justify-center items-end">
    <div 
      ref="textRef"
      class="whitespace-nowrap origin-right transition-transform duration-200"
      :style="{ transform: `scale(${scale})` }"
    >
      {{ text }}
    </div>
  </div>
</template>
