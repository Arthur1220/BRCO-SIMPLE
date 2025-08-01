<template>
  <header class="site-header">
    <div class="container header-container">
      <router-link to="/" class="logo">
        <h3><strong>BRCO</strong></h3>
      </router-link>

      <div :class="['nav-overlay', { 'is-open': isMenuOpen }]" @click="closeMenu"></div>

      <nav class="main-nav" :class="{ 'is-open': isMenuOpen }">
        <ul class="nav-links" @click.stop>
          <li class="nav-item-dropdown">
            <span class="dropdown-toggle">Calculadoras</span>
            <ul class="dropdown-menu">
              <li><router-link to="/calcular/exigencias" @click="closeMenu">Exigências Nutricionais</router-link></li>
              <li><router-link to="/calcular/ndt" @click="closeMenu">Cálculo de NDT</router-link></li>
            </ul>
          </li>
          <li><router-link to="/equipe" @click="closeMenu">Equipe</router-link></li>
        </ul>
      </nav>

      <button class="menu-toggle" @click="toggleMenu" aria-label="Toggle menu">
        <div class="icon-wrapper">
          <div class="bar bar-top" :class="{ 'is-open': isMenuOpen }"></div>
          <div class="bar bar-middle" :class="{ 'is-open': isMenuOpen }"></div>
          <div class="bar bar-bottom" :class="{ 'is-open': isMenuOpen }"></div>
        </div>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const isMenuOpen = ref(false);
const route = useRoute();

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value;
}

function closeMenu() {
  isMenuOpen.value = false;
}

// Fecha o menu automaticamente ao navegar para uma nova página
watch(() => route.path, () => {
  isMenuOpen.value = false;
});
</script>

<style scoped>
/* --- Estrutura e Estilos Base --- */
.site-header {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  padding: 1rem 2rem;
  z-index: 1000;
  /* Fundo do header com transparência e desfoque */
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--grey-light);
  height: 80px;
}
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
}
.logo { text-decoration: none; color: var(--black); z-index: 1001; }
.logo h3 { margin: 0; font-size: 1.8rem; letter-spacing: -1px; }
.logo h3 strong { color: var(--orange); }
.menu-toggle { display: none; background: none; border: none; color: var(--black); cursor: pointer; z-index: 1001; padding: 0.5rem; }

/* --- Navegação Desktop (a partir de 992px) --- */
@media (min-width: 992px) {
  .main-nav { position: absolute; left: 50%; transform: translateX(-50%); }
  .nav-links { list-style: none; display: flex; gap: 2.5rem; margin: 0; padding: 0; align-items: center; }
  .nav-links li a, .dropdown-toggle { position: relative; text-decoration: none; color: var(--black-light); font-size: 1rem; font-weight: 500; transition: color 0.3s ease; padding: 0.5rem 0; cursor: default; }
  .nav-links li a::after { content: ''; position: absolute; width: 0; height: 2px; bottom: 0; left: 50%; transform: translateX(-50%); background-color: var(--orange); transition: width 0.3s ease-in-out; }
  .nav-links li a:hover, .nav-links li a.router-link-exact-active { color: var(--black); }
  .nav-links li a:hover::after, .nav-links li a.router-link-exact-active::after { width: 100%; }

  .nav-item-dropdown { position: relative; }
  .dropdown-menu { position: absolute; top: 100%; left: 50%; transform: translateX(-50%) translateY(10px); background-color: var(--white); border-radius: var(--border-radius); box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1); list-style: none; padding: 0.5rem; margin-top: 1rem; min-width: 220px; opacity: 0; visibility: hidden; transition: all 0.3s ease; z-index: 1100; }
  .nav-item-dropdown:hover .dropdown-menu { opacity: 1; visibility: visible; transform: translateX(-50%) translateY(0); }
  .dropdown-menu li { width: 100%; }
  .dropdown-menu li a { display: block; padding: 0.8rem 1rem; border-radius: 6px; white-space: nowrap; cursor: pointer; }
  .dropdown-menu li a:hover { background-color: var(--grey-light); }
  .nav-overlay { display: none; }
}

/* --- Navegação Mobile (Até 991px) --- */
@media (max-width: 991px) {
  .menu-toggle { display: block; }
  .icon-wrapper { width: 28px; height: 24px; position: relative; }
  .bar { position: absolute; left: 0; width: 100%; height: 3px; border-radius: 2px; background-color: var(--black); transition: all 0.3s ease-in-out; }
  .bar-top { top: 0; }
  .bar-middle { top: 50%; transform: translateY(-50%); }
  .bar-bottom { bottom: 0; }
  .bar-top.is-open { top: 50%; transform: translate(0, -50%) rotate(45deg); }
  .bar-middle.is-open { opacity: 0; }
  .bar-bottom.is-open { bottom: 50%; transform: translate(0, 50%) rotate(-45deg); }

  /* O fundo semi-transparente que cobre a página */
  .nav-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.4s ease;
    z-index: 998;
  }
  .main-nav.is-open + .nav-overlay {
    opacity: 1;
    visibility: visible;
  }

  /* O painel de links que desliza */
  .main-nav {
    position: fixed;
    top: 0;
    right: -100%; /* Começa fora da tela */
    width: 80%;
    max-width: 320px;
    height: 100vh;
    background-color: var(--white); /* COR SÓLIDA AQUI */
    box-shadow: -5px 0 15px rgba(0,0,0,0.1);
    transition: right 0.4s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 999;
  }
  .main-nav.is-open {
    right: 0; /* Desliza para dentro */
  }
  .nav-links {
    list-style: none;
    padding: 100px 2rem 2rem;
    margin: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start; /* Alinha os itens à esquerda */
    gap: 1rem;
    text-align: left;
  }
  .nav-links li, .nav-item-dropdown {
    width: 100%;
  }
  .nav-links li a, .dropdown-toggle {
    display: block;
    padding: 1rem;
    font-size: 1.2rem;
    font-weight: 500;
    color: var(--black-light);
    text-decoration: none;
    border-radius: var(--border-radius);
    transition: all 0.3s ease;
  }
  .nav-links li a:hover, .nav-links li a.router-link-exact-active {
    background-color: var(--grey-light);
    color: var(--orange);
  }

  /* Estilo do título 'Calculadoras' no mobile */
  .nav-item-dropdown .dropdown-toggle {
    font-size: 1.4rem;
    color: var(--black);
    padding-left: 0;
    font-weight: bold;
    cursor: default;
    margin-bottom: 0.5rem;
  }
  .dropdown-menu {
    list-style: none;
    padding-left: 1rem; /* Indentação para submenu */
    margin: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .dropdown-menu li a {
    font-size: 1.1rem;
  }
}
</style>
