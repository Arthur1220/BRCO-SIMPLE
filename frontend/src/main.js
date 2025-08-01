import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

import 'aos/dist/aos.css';
import './assets/main.css'

import AOS from 'aos';

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

AOS.init({
  duration: 800, // Duração da animação em milissegundos
  once: true,    // A animação acontece apenas uma vez
  offset: 120,   // Começa a animar quando o elemento está a 120px da parte inferior da tela
});
