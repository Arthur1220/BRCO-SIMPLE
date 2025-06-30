<template>
  <header class="main-header">
    <div class="container header-container">
      <router-link to="/" class="logo">
        <h3><strong>BRCO</strong></h3>
      </router-link>
      
      <nav class="main-nav">
        <ul :class="['nav-links', { active: navLinksVisible }]" @click="closeMenu">
          
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

// Controla a visibilidade do menu de navegação em telas mobile.
const navLinksVisible = ref(false);

// Alterna a visibilidade do menu.
function toggleMenu() {
  navLinksVisible.value = !navLinksVisible.value;
}

// Fecha o menu (usado quando um link é clicado no modo mobile).
function closeMenu() {
  navLinksVisible.value = false;
}
</script>

<style scoped>
/* --- Estrutura Principal do Header --- */
.main-header {
  width: 100%;
  background-color: var(--white);
  border-bottom: 1px solid var(--grey-light);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
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
.logo { 
  text-decoration: none; 
  color: var(--black); 
  flex-shrink: 0; /* Impede que o logo encolha */
}
.logo h3 { 
  margin: 0; 
  font-size: 1.8rem; 
  letter-spacing: -1px; 
}
.logo h3 strong { 
  color: var(--orange); 
}

/* --- Navegação Principal e Dropdown (Desktop) --- */
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
.mobile-only { 
  display: none; 
}
.nav-item-dropdown { 
  position: relative; 
}
.nav-item-dropdown > a { 
  cursor: default; 
}
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
.dropdown-menu li { 
  width: 100%; 
}
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

/* --- Menu Mobile (Hamburguer) --- */
.header-options { 
  display: flex; 
  align-items: center; 
}
.burger-menu { 
  display: none; 
}

@media (max-width: 768px) {
  .desktop-only { 
    display: none; 
  }
  .mobile-only { 
    display: block; 
  }
  .main-nav { 
    display: none; 
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
  .bar-1-active { 
    transform: rotate(45deg) translate(6px, 6px); 
  }
  .bar-2-active { 
    opacity: 0; 
  }
  .bar-3-active { 
    transform: rotate(-45deg) translate(7px, -7px); 
  }

  /* Estilo do menu mobile que desliza */
  .nav-links {
    position: fixed;
    top: 0;
    right: -100%;
    width: 70%;
    max-width: 300px;
    height: 100vh;
    padding-top: 100px;
    flex-direction: column;
    align-items: center;
    gap: 2rem;
    background-color: var(--white);
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    transition: right 0.4s ease-in-out;
  }
  .nav-links.active { 
    right: 0; 
  }
}
</style>