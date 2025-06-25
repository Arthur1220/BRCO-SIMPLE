<template>
  <div class="container">
    <main>
      <section class="hero">
        <div class="hero-content">
          <h1><strong>BRCO:</strong></h1>
          <h2>BR-Caprinos & Ovinos</h2>
          <p class="subtitle">Acesse recursos detalhados e gratuitos para otimizar a nutrição de caprinos e ovinos no Brasil.</p>
          <div class="cta-buttons">
            <router-link to="/calcular/exigencias" class="btn btn-primary">Começar a Calcular</router-link>
            <router-link to="/equipe" class="btn btn-secondary">Conheça a Equipe</router-link>
          </div>
        </div>
        <div class="hero-image">
          <img src="@/assets/images/ovino-caprino.png" alt="Ilustração de um caprino e um ovino">
        </div>
      </section>

      <hr>

      <section class="features">
        <div class="feature-card">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
          </div>
          <h3>Exigências Nutricionais</h3>
          <p>Determine de forma precisa as exigências de energia, proteína e minerais para otimizar o desempenho e a saúde dos animais.</p>
        </div>
        <div class="feature-card">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153.344c-1.32.083-2.643.083-3.963 0a5.988 5.988 0 01-2.153-.344c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.698c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.344c1.32.083 2.643.083 3.963 0a5.989 5.989 0 002.153-.344c.483-.174.711-.703.59-1.202L5.25 4.971z" /></svg>
          </div>
          <h3>Análise de Alimentos (NDT)</h3>
          <p>Calcule os Nutrientes Digestíveis Totais (NDT) dos alimentos para formular dietas balanceadas e econômicas.</p>
        </div>
        <div class="feature-card">
          <div class="icon-wrapper">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
          </div>
          <h3>Relatórios para Impressão</h3>
          <p>Gere e exporte relatórios em PDF com os resultados dos seus cálculos para fácil consulta, arquivamento e compartilhamento.</p>
        </div>
      </section>

      <hr>

      <section class="about">
        <div class="about-image">
          <img src="@/assets/images/goat-02.jpg" alt="Foto de um caprino em um campo">
        </div>
        <div class="about-content">
          <div>
            <h2>Sobre o Projeto</h2>
            <p>Para atender a essa necessidade, o INCT em Ciência Animal, em 2014, criou um Subcomitê dedicado ao desenvolvimento do sistema brasileiro de exigências nutricionais de pequenos ruminantes. Um grupo de pesquisadores experientes coletou e analisou dados de diversas regiões, resultando na publicação do livro "BR - Caprinos & Ovinos".</p>
            <p>Esta obra, juntamente com este portal, oferece uma revisão abrangente e acessível das mais recentes pesquisas científicas e experiências práticas na área, servindo como uma referência valiosa tanto para estudantes quanto para especialistas.</p>
          </div>
          <div class="cta-final">
            <h3>Pronto para otimizar sua produção?</h3>
            <router-link to="/calcular/exigencias" class="btn btn-primary">Comece a usar gratuitamente</router-link>
          </div>
        </div>
      </section>

    </main>
  </div>
</template>

<style scoped>
main {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

/* Hero Section */
.hero {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4rem 0;
  gap: 3rem;
}
.hero-content { flex: 1; }
.hero-image { flex: 1; text-align: right; }
.hero-image img {
  width: 100%;
  max-width: 500px;
  height: auto;
}
.hero h1 { font-size: 5rem; color: var(--orange); margin: 0; line-height: 1; }
.hero h2 { font-size: 2rem; color: var(--black-light); margin: 0.5rem 0 1rem; font-weight: 400; }
.hero .subtitle { font-size: 1.2rem; color: var(--black-light); max-width: 500px; }
.cta-buttons { display: flex; gap: 1rem; margin-top: 2rem; }
.btn {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}
.btn-primary { background-color: var(--orange); color: var(--white); }
.btn-primary:hover { background-color: var(--light-orange); transform: translateY(-2px); }
.btn-secondary { background-color: transparent; color: var(--orange); border-color: var(--orange); }
.btn-secondary:hover { background-color: var(--orange); color: var(--white); transform: translateY(-2px); }

hr {
  width: 80%;
  height: 1px;
  background-color: var(--grey-light);
  border: none;
  margin: 2rem auto;
}

/* Features Section */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 2rem 0;
}
.feature-card {
  text-align: center;
  padding: 2rem;
}
.icon-wrapper {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: var(--light-orange);
  color: var(--white);
  margin-bottom: 1.5rem;
}
.icon-wrapper svg {
  width: 32px;
  height: 32px;
}
.feature-card h3 {
  font-size: 1.5rem;
  margin: 0 0 1rem;
}
.feature-card p {
  color: var(--black-light);
  line-height: 1.6;
}

/* About Section */
.about {
  display: flex;
  align-items: center;
  gap: 3rem;
  padding: 4rem 0;
}
.about-image { flex: 1; }
.about-image img {
  width: 100%;
  border-radius: 12px;
}
.about-content { flex: 1.2; }
.about-content h2 {
  font-size: 2.5rem;
  color: var(--orange);
  margin-top: 0;
}
.about-content p {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--black-light);
}
.cta-final {
  margin-top: 2rem;
  padding: 1.5rem;
  text-align: center;
}
.cta-final h3 { margin: 0 0 2rem; }

/* Responsividade */
@media (max-width: 992px) {
  .hero, .about {
    flex-direction: column;
    text-align: center;
  }
  .hero-content, .about-content {
    order: 2;
  }
  .hero-image, .about-image {
    order: 1;
    margin-bottom: 2rem;
  }
  .hero h1 { font-size: 4rem; }
  .hero .subtitle, .about-content p { max-width: 100%; }
  .cta-buttons { justify-content: center; }
}
</style>