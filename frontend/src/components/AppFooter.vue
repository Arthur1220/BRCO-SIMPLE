<template>
  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        
        <div class="footer-column">
          <h4>Sobre o BRCO</h4>
          <p class="footer-about-text">
            Um portal de acesso livre para otimizar a nutrição de caprinos e ovinos, baseado em pesquisas científicas brasileiras.
          </p>
        </div>

        <div class="footer-column">
          <h4>Navegação</h4>
          <ul class="footer-links">
            <li><router-link to="/">Home</router-link></li>
            <li><router-link to="/calcular/exigencias">Calculadoras</router-link></li>
            <li><router-link to="/equipe">Equipe</router-link></li>
            <li><router-link to="/admin">Admin</router-link></li> 
          </ul>
        </div>

        <div class="footer-column">
          <h4>Apoio</h4>
          <div class="support-logos">
            <a href="https://www.cnpq.br/" target="_blank" rel="noopener noreferrer" title="CNPq">
              <img src="@/assets/logos/cnpq.jpg" alt="Logo CNPq">
            </a>
            <a href="https://www.uesc.br/" target="_blank" rel="noopener noreferrer" title="UESC">
              <img src="@/assets/logos/uesc.png" alt="Logo UESC">
            </a>
            <a href="https://www.ufc.br/" target="_blank" rel="noopener noreferrer" title="UFC">
              <img src="@/assets/logos/ufc.png" alt="Logo UFC">
            </a>
            <a href="https://www.ufba.br/" target="_blank" rel="noopener noreferrer" title="UFBA">
              <img src="@/assets/logos/ufba.png" alt="Logo UFBA">
            </a>
          </div>
        </div>

      </div>

      <div class="footer-bottom">
        <p>&copy; {{ new Date().getFullYear() }} BRCO - Todos os direitos reservados. Desenvolvido com base no livro "Exigências Nutricionais de Caprinos e Ovinos - BR-Caprinos e Ovinos".</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  background-color: var(--black);
  color: var(--grey);
  padding: 4rem 0 2rem;
  font-size: 0.95rem;
  clip-path: polygon(0 5%, 100% 0, 100% 100%, 0 100%); /* Efeito de topo diagonal */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.footer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 3rem;
  padding-bottom: 3rem;
}

.footer-column h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--white);
  margin-top: 0;
  margin-bottom: 1.5rem;
  position: relative;
}

/* Linha decorativa abaixo dos títulos das colunas */
.footer-column h4::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: -8px;
  width: 30px;
  height: 2px;
  background-color: var(--orange);
}

.footer-about-text {
  line-height: 1.7;
  padding-right: 1rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.8rem;
}

.footer-links a {
  color: var(--grey);
  text-decoration: none;
  transition: color 0.3s ease, padding-left 0.3s ease;
}

.footer-links a:hover {
  color: var(--white);
  padding-left: 5px;
}

.support-logos {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: center;
}

.support-logos img {
  max-height: 40px; /* Ajuste a altura conforme necessário */
  filter: grayscale(100%) brightness(150%); /* Deixa os logos brancos/cinza */
  opacity: 0.7;
  transition: opacity 0.3s ease, filter 0.3s ease;
}

.support-logos a:hover img {
  opacity: 1;
  filter: none; /* Remove o filtro no hover */
}

.footer-bottom {
  border-top: 1px solid var(--black-light);
  padding-top: 2rem;
  text-align: center;
  font-size: 0.85rem;
}

.footer-bottom p {
  margin: 0;
}
</style>