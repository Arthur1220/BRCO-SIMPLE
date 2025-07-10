<template>
  <header class="main-header">
    <div class="container header-container">
      <router-link to="/" class="logo">
        <h3><strong>BRCO</strong></h3>
      </router-link>
      
      <nav :class="['main-nav', { 'nav-active': navLinksVisible }]" @click="closeMenu">
        <ul class="nav-links">
          
          <li class="nav-item-dropdown desktop-only">
            <a href="#" @click.prevent>Calculadoras</a>
            <ul class="dropdown-menu">
              <li><router-link to="/calcular/exigencias">Exigências Nutricionais</router-link></li>
              <li><router-link to="/calcular/ndt">Cálculo de NDT</router-link></li>
            </ul>
          </li>

          <li class="mobile-only"><router-link to="/calcular/exigencias">Exigências</router-link></li>
          <li class="mobile-only"><router-link to="/calcular/ndt">NDT</router-link></li>
          
          <li><router-link to="/equipe">Equipe</router-link></li>
        </ul>
      </nav>

      <div class="header-options">
        <div class="burger-menu" @click.stop="toggleMenu">
          <div :class="['bar', { 'bar-1-active': navLinksVisible }]"></div>
          <div :class="['bar', { 'bar-2-active': navLinksVisible }]"></div>
          <div :class="['bar', { 'bar-3-active': navLinksVisible }]"></div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';
const navLinksVisible = ref(false);
function toggleMenu() { navLinksVisible.value = !navLinksVisible.value; }
function closeMenu() { navLinksVisible.value = false; }
</script>

<style scoped>
/* ... (estilos gerais do header que já estavam corretos) ... */
.main-header {
  /* ... */
  z-index: 1000;
  height: 80px;
  display: flex;
  align-items: center;
}
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}
.logo { text-decoration: none; color: var(--black); }
.logo h3 { margin: 0; font-size: 1.8rem; letter-spacing: -1px; }
.logo h3 strong { color: var(--orange); }

.main-nav {
  display: flex;
}
.nav-links {
  list-style: none;
  display: flex;
  gap: 2.5rem;
  margin: 0;
  padding: 0;
  align-items: center;
}
.nav-links li a {
  position: relative;
  text-decoration: none;
  color: var(--black-light);
  font-size: 1rem;
  font-weight: 500;
  transition: color 0.3s ease;
  padding: 0.5rem 0;
}
.nav-links li a::after {
  content: '';
  position: absolute;
  width: 0;
  height: 2px;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background-color: var(--orange);
  transition: width 0.3s ease-in-out;
}
.nav-links li a:hover,
.nav-links li a.router-link-exact-active {
  color: var(--black);
}
.nav-links li a:hover::after,
.nav-links li a.router-link-exact-active::after {
  width: 100%;
}
.mobile-only { display: none; }
.nav-item-dropdown { position: relative; }
.nav-item-dropdown > a { cursor: default; }

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background-color: var(--white);
  border-radius: var(--border-radius);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  list-style: none;
  padding: 0.5rem;
  margin-top: 1rem;
  min-width: 220px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  z-index: 1100;
}
.nav-item-dropdown:hover .dropdown-menu {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0);
}
.dropdown-menu li { width: 100%; }
.dropdown-menu li a {
  display: block;
  padding: 0.8rem 1rem;
  border-radius: 6px;
  white-space: nowrap;
}
.dropdown-menu li a:hover {
  background-color: var(--grey-light);
  color: var(--black);
}

.header-options { display: flex; align-items: center; }
.burger-menu { display: none; }

/* --- Media Query para Mobile --- */
@media (max-width: 768px) {
  .desktop-only { display: none; }
  .mobile-only { display: block; }
  
  /* CORREÇÃO: Em vez de esconder o <nav>, nós escondemos o menu
     e o mostramos apenas quando a classe 'active' é adicionada. */
  .main-nav {
    position: fixed;
    top: 0;
    right: 0;
    width: 100%;
    height: 100vh;
    pointer-events: none; /* Não pode ser clicado quando escondido */
  }
  .main-nav.nav-active .nav-links {
    right: 0; /* Desliza para dentro da tela */
  }
  .main-nav.nav-active {
    pointer-events: all; /* Pode ser clicado quando ativo */
  }

  .nav-links {
    position: absolute;
    top: 0;
    right: -100%; /* Começa fora da tela */
    width: 70%;
    max-width: 300px;
    height: 100%;
    padding-top: 100px;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    background-color: var(--white);
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    transition: right 0.4s ease-in-out;
  }
  .burger-menu {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
    width: 28px;
    height: 24px;
    cursor: pointer;
    z-index: 1100;
  }
  .bar {
    width: 100%;
    height: 3px;
    border-radius: 10px;
    background-color: var(--black);
    transition: all 0.3s ease-in-out;
  }
  .bar-1-active { transform: rotate(45deg) translate(6px, 6px); }
  .bar-2-active { opacity: 0; }
  .bar-3-active { transform: rotate(-45deg) translate(7px, -7px); }
}
</style>