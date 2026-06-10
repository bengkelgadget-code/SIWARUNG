import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayoutStore = defineStore('layout', () => {
  const isSidebarOpen = ref(false)
  const isCartModalOpen = ref(false)

  function toggleSidebar() {
    isSidebarOpen.value = !isSidebarOpen.value
  }

  function closeSidebar() {
    isSidebarOpen.value = false
  }

  function toggleCartModal() {
    isCartModalOpen.value = !isCartModalOpen.value
  }

  function closeCartModal() {
    isCartModalOpen.value = false
  }

  return { 
    isSidebarOpen, 
    isCartModalOpen, 
    toggleSidebar, 
    closeSidebar,
    toggleCartModal,
    closeCartModal
  }
})
