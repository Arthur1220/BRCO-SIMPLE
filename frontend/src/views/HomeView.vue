<template>
  <main class="home-view">

    <section class="hero-section container">
      <div class="hero-content" data-aos="fade-right">
        <h1 class="hero-title">BRCO</h1>
        <h2 class="hero-subtitle">BR-Caprinos & Ovinos</h2>
        <p class="hero-description">
          Acesse recursos detalhados e gratuitos para otimizar a nutrição de caprinos e ovinos no Brasil, com base em dados científicos validados.
        </p>
        <div class="cta-buttons">
          <router-link to="/calcular/exigencias" class="btn btn-primary" data-aos="fade-up" data-aos-delay="100">Começar a Calcular</router-link>
          <router-link to="/equipe" class="btn btn-secondary" data-aos="fade-up" data-aos-delay="200">Conheça a Equipe</router-link>
        </div>
      </div>
      <div class="hero-image" data-aos="fade-left" data-aos-delay="300">
        <img src="@/assets/images/ovino-caprino.png" alt="Ilustração de um caprino e um ovino">
      </div>
    </section>

    <section class="features-section">
      <div class="container">
        <div class="section-title" data-aos="fade-up">
          <span>Funcionalidades</span>
          <h3>Tudo que Você Precisa em um Só Lugar</h3>
        </div>

        <div class="features-grid">
          <div class="feature-card" data-aos="fade-up" data-aos-delay="100">
            <div class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
            </div>
            <h4>Exigências Nutricionais</h4>
            <p>Determine de forma precisa as exigências de energia, proteína e minerais para otimizar o desempenho e a saúde dos animais.</p>
          </div>

          <div class="feature-card" data-aos="fade-up" data-aos-delay="200">
            <div class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.153-.344c-1.32.083-2.643.083-3.963 0a5.988 5.988 0 01-2.153-.344c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c-1.01.143-2.01.317-3 .52m3-.52L2.62 15.698c-.122.499.106 1.028.589 1.202a5.989 5.989 0 002.153.344c1.32.083 2.643.083 3.963 0a5.989 5.989 0 002.153-.344c.483-.174.711-.703.59-1.202L5.25 4.971z" /></svg>
            </div>
            <h4>Análise de Alimentos (NDT)</h4>
            <p>Calcule os Nutrientes Digestíveis Totais (NDT) dos alimentos para formular dietas balanceadas e econômicas.</p>
          </div>

          <div class="feature-card" data-aos="fade-up" data-aos-delay="300">
            <div class="icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
            </div>
            <h4>Relatórios para Exportação</h4>
            <p>Gere relatórios em CSV com os resultados dos seus cálculos para fácil consulta, arquivamento e compartilhamento.</p>
          </div>
        </div>
      </div>
    </section>

    <section class="diet-intro-section">
        <div class="container">
          <div class="section-title" data-aos="fade-up">
            <span>Novo Recurso</span>
            <h3>Como Funciona a Formulação de Dieta?</h3>
          </div>

          <div class="steps-grid">
            <div class="step-item" data-aos="fade-up" data-aos-delay="100">
              <span class="step-number">1</span>
              <h4>Defina o Animal</h4>
              <p>Informe a espécie, peso e ganho desejado para calcular as metas nutricionais exatas.</p>
            </div>
            <div class="step-item" data-aos="fade-up" data-aos-delay="200">
              <span class="step-number">2</span>
              <h4>Escolha os Alimentos</h4>
              <p>Use nossa base de dados ou <strong>cadastre seus próprios alimentos</strong> com valores nutricionais personalizados.</p>
            </div>
             <div class="step-item" data-aos="fade-up" data-aos-delay="300">
              <span class="step-number">3</span>
              <h4>Otimize Automaticamente</h4>
              <p>Defina limites e nosso sistema calculará a <strong>dieta ideal</strong> para você.</p>
            </div>
          </div>

          <div class="center-btn" data-aos="fade-up" data-aos-delay="400">
             <router-link to="/formulacao-dieta" class="btn btn-primary">Experimentar Agora</router-link>
          </div>
        </div>
      </section>

    <hr>

    <section class="about-section container" data-aos="fade-up">
      <div class="about-image" data-aos="fade-right" data-aos-delay="100">
        <img src="@/assets/images/goat-02.jpg" alt="Foto de um caprino em um campo">
      </div>
      <div class="about-content" data-aos="fade-left" data-aos-delay="100">
        <div class="section-title left-aligned">
          <span>Nossa Missão</span>
          <h3>Ciência Aplicada à Produção</h3>
        </div>
        <p>Para atender a essa necessidade, o INCT em Ciência Animal, em 2014, criou um Subcomitê dedicado ao desenvolvimento do sistema brasileiro de exigências nutricionais de pequenos ruminantes. Um grupo de pesquisadores experientes coletou e analisou dados de diversas regiões, resultando na publicação do livro "BR - Caprinos & Ovinos".</p>
      </div>
    </section>

    <section class="book-section" data-aos="fade-up">
      <div class="container book-container">
        <div class="book-details" data-aos="fade-right" data-aos-delay="100">
          <div class="section-title left-aligned">
            <span>Nossa Fonte</span>
            <h3>Baseado em Ciência</h3>
          </div>
          <p class="source-text">
            Toda a base de conhecimento, incluindo fórmulas e valores de referência, foi extraída diretamente da publicação <strong>"Exigências Nutricionais de Caprinos e Ovinos - BR-Caprinos e Ovinos"</strong>.
          </p>
        </div>
        <div class="book-cover" data-aos="fade-left" data-aos-delay="100">
          <a href="https://brcaprinoseovinos.ufc.br/pt/pagina-de-introducao/" target="_blank" rel="noopener noreferrer">
            <img src="@/assets/images/BRCO.jpg" alt="Capa do livro BR-CORTE">
          </a>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
</script>

<style scoped>
/* =========================================
   1. Estrutura Base & Títulos
   ========================================= */
.container {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Títulos de Seção Padronizados */
.section-title {
  text-align: center;
  margin-bottom: 3rem;
}

.section-title span {
  color: var(--orange);
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.9rem;
  letter-spacing: 1px;
}

.section-title h3 {
  font-size: 2.5rem;
  color: var(--black);
  margin: 0.5rem 0 0;
}

.section-title.left-aligned {
  text-align: left;
}

hr {
  width: 80%;
  height: 1px;
  background-color: var(--grey-light);
  border: none;
  margin: 2rem auto;
}

/* =========================================
   2. Hero Section (Topo da Página)
   ========================================= */
.hero-section {
  display: flex;
  align-items: center;
  padding: 5rem 0;
  gap: 3rem;
}

.hero-content {
  flex: 1.2;
}

.hero-title {
  font-size: 5.5rem;
  color: var(--orange);
  margin: 0;
  line-height: 1;
  font-weight: 800;
}

.hero-subtitle {
  font-size: 2rem;
  color: var(--black-light);
  margin: 0.5rem 0 1.5rem;
  font-weight: 400;
}

.hero-description {
  font-size: 1.2rem;
  color: var(--black-light);
  max-width: 550px;
  line-height: 1.6;
}

.hero-image {
  flex: 1;
  text-align: center;
}

.hero-image img {
  max-width: 100%;
  height: auto;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2.5rem;
}

/* =========================================
   3. Botões Globais (CTA)
   ========================================= */
.btn {
  padding: 0.9rem 2rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: bold;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

/* Botão Primário (Preenchido) */
.btn-primary {
  background-color: var(--orange);
  color: var(--white);
}

.btn-primary:hover {
  background-color: var(--light-orange);
  transform: translateY(-3px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* Botão Secundário (Contorno) */
.btn-secondary {
  background-color: transparent;
  color: var(--orange);
  border-color: var(--orange);
}

.btn-secondary:hover {
  background-color: var(--orange);
  color: var(--white);
  transform: translateY(-3px);
}

.center-btn {
  text-align: center;
  margin-top: 2rem;
}

/* =========================================
   4. Features Section (Cards de Recursos)
   ========================================= */
.features-section {
  padding: 5rem 0;
  background-color: #fdfdfd;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
}

.feature-card {
  text-align: center;
  padding: 2.5rem 2rem;
  background-color: var(--white);
  border: 1px solid var(--grey-light);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.07);
}

.feature-card h4 {
  font-size: 1.4rem;
  margin: 0 0 1rem;
}

.feature-card p {
  color: var(--black-light);
  line-height: 1.6;
}

/* Ícone do Feature */
.icon-wrapper {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background-color: rgba(245, 130, 32, 0.1); /* Laranja suave */
  color: var(--orange);
  margin-bottom: 1.5rem;
}

.icon-wrapper svg {
  width: 32px;
  height: 32px;
}

/* =========================================
   5. Diet Intro Section (Passo a Passo)
   ========================================= */
.diet-intro-section {
  padding: 5rem 0;
  background-color: var(--white);
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  text-align: center;
}

.step-item {
  padding: 1rem;
}

.step-number {
  display: inline-block;
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 50%;
  background-color: var(--orange);
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
  margin-bottom: 1rem;
}

.step-item h4 {
  font-size: 1.3rem;
  margin-bottom: 0.5rem;
  color: var(--black);
}

.step-item p {
  color: var(--black-light);
  line-height: 1.5;
}

/* =========================================
   6. About & Book Sections (Informacional)
   ========================================= */
.about-section,
.book-section {
  padding: 5rem 0;
}

.about-image img,
.book-cover img {
  width: 100%;
  border-radius: 12px;
}

/* --- About Section --- */
.about-section {
  display: flex;
  align-items: center;
  gap: 4rem;
}

.about-image {
  flex: 1;
}

.about-content {
  flex: 1.2;
}

.about-content p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--black-light);
}

/* --- Book Section --- */
.book-section {
  background-color: #fdfdfd;
}

.book-container {
  display: flex;
  align-items: center;
  gap: 4rem;
}

.book-details {
  flex: 1.2;
}

.book-details .source-text {
  font-size: 1.2rem;
  color: var(--black);
  line-height: 1.7;
  border-left: 4px solid var(--orange);
  padding-left: 1.5rem;
  margin-bottom: 1.5rem;
}

.book-details p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--black-light);
}

/* Capa do Livro Interativa */
.book-cover {
  flex-shrink: 0;
}

.book-cover img {
  max-width: 300px;
  margin: 0 auto;
  display: block;
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
}

.book-cover:hover img {
  transform: scale(1.05); /* Zoom suave */
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* =========================================
   7. Responsividade (Tablets e Mobiles)
   ========================================= */
@media (max-width: 992px) {
  /* Layout de Coluna Única para seções principais */
  .hero-section,
  .about-section,
  .book-container {
    flex-direction: column;
    text-align: center;
  }

  /* Reordenação: Conteúdo embaixo, Imagem em cima */
  .hero-content,
  .about-content,
  .book-details {
    order: 2;
  }

  .hero-image,
  .about-image,
  .book-cover {
    order: 1;
    margin-bottom: 3rem;
    text-align: center;
  }

  /* Ajustes de Texto e Botões */
  .section-title.left-aligned {
    text-align: center;
  }

  .cta-buttons {
    justify-content: center;
  }

  /* Remove borda lateral no mobile para ficar mais limpo */
  .book-details .source-text {
    border-left: none;
    padding-left: 0;
  }
}

@media (max-width: 768px) {
  .section-title h3 {
    font-size: 2rem;
  }

  .hero-title {
    font-size: 4rem;
  }

  .hero-subtitle {
    font-size: 1.5rem;
  }
}
</style>
