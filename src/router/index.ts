import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'penjualan',
      component: () => import('@/views/PenjualanView.vue'),
      meta: { title: 'Penjualan' },
    },
    {
      path: '/stok-barang',
      name: 'stok-barang',
      component: () => import('@/views/StokBarangView.vue'),
      meta: { title: 'Stok Barang' },
    },
    {
      path: '/setting',
      name: 'setting',
      component: () => import('@/views/SettingView.vue'),
      meta: { title: 'Pengaturan' },
    },
    {
      path: '/belanja',
      name: 'belanja',
      component: () => import('@/views/BelanjaBarangView.vue'),
      meta: { title: 'Belanja Barang' },
    },
  ],
})

router.beforeEach((to) => {
  document.title = `${to.meta.title || 'Warung POS'} - Warung POS`
})

export default router
