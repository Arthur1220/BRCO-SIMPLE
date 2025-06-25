<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-section">
        <ul>
          <li><router-link to="/">Home</router-link></li>
          <li><router-link to="/calcular/exigencias">Calcular Exigências</router-link></li>
          <li><router-link to="/calcular/ndt">Calcular NDT</router-link></li>
          <li><router-link to="/equipe">Equipe</router-link></li>
        </ul>
      </div>
      <div class="footer-section">
        <p>BRCO &copy; {{ new Date().getFullYear() }} All Rights Reserved.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--grey-light);
  color: var(--black-light);
  font-size: 0.9rem;
  padding: 2rem 0;
  width: 100%;
  margin-top: 3rem; /* Espaço para não colar no conteúdo */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 1rem;
}

.footer-section {
  text-align: center;
}

.footer-section ul {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 1.5rem;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.footer-section ul li a {
  color: var(--black-light);
  text-decoration: none;
  transition: color 0.3s;
}

.footer-section ul li a:hover {
  color: var(--orange);
}
</style>