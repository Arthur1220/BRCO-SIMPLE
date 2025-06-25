// src/router/index.js
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
      // Rota dinâmica para os cálculos
      path: '/calcular/:type', // :type será 'ndt' ou 'exigencias'
      name: 'calculator',
      component: CalculatorView,
      props: true // Passa o parâmetro 'type' como prop para o componente
    },
    {
      path: '/equipe',
      name: 'equipe',
      component: EquipeView
    },
  ]
})

export default router