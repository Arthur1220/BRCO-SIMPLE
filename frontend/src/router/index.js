import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import CalculatorView from '../views/CalculatorView.vue'
import EquipeView from '../views/EquipeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/calcular/:type', // :type será 'ndt' ou 'exigencias'
      name: 'calculator',
      component: CalculatorView,
      props: true 
    },
    {
      path: '/equipe',
      name: 'equipe',
      component: EquipeView
    },
    {
    path: '/admin',
    name: 'admin',
    component: () => import('../views/AdminView.vue') 
    },
  ]
})

export default router