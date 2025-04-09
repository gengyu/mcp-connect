import { createRouter, createWebHistory } from 'vue-router'
import ConfigList from '@/components/ConfigList.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/config',
    name: 'Home',
    component: () => import('@/views/ConfigView.vue')
  },
  {
    path: '/configs',
    name: 'Configs',
    component: ConfigList
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router