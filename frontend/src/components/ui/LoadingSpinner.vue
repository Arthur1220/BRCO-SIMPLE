<template>
  <div class="spinner-overlay">
    <div class="spinner-card">
      <div class="spinner"></div>
      <p>Processando...</p>
    </div>
  </div>
</template>

<style scoped>
/* =========================================
   1. Overlay (Fundo de Bloqueio)
   ========================================= */
.spinner-overlay {
  position: fixed;
  inset: 0; /* Shorthand moderno para top:0, right:0, bottom:0, left:0 */
  z-index: 9999; /* Garante que fique acima de tudo */
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px); /* Efeito de vidro fosco */

  /* Centralização do Card */
  display: flex;
  justify-content: center;
  align-items: center;

  /* Previne rolagem do conteúdo atrás do overlay */
  overscroll-behavior: contain;
}

/* =========================================
   2. Card do Spinner (Container Visual)
   ========================================= */
.spinner-card {
  background: #ffffff;
  padding: 2rem 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  border: 1px solid var(--grey-light);

  /* Layout interno */
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;

  /* Tamanho responsivo seguro */
  max-width: 90%;
  width: auto;
}

/* =========================================
   3. Elemento Animado (O Círculo)
   ========================================= */
.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3; /* Cor base (cinza claro) */
  border-top: 5px solid var(--orange); /* Cor de destaque que gira */
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* =========================================
   4. Tipografia (Texto de Loading)
   ========================================= */
p {
  margin: 0;
  font-weight: 600;
  color: var(--black);
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  text-align: center;
}

/* =========================================
   5. Responsividade (Mobile)
   ========================================= */
@media (max-width: 600px) {
  .spinner-card {
    padding: 1.5rem 2rem;
    border-radius: 12px;
    width: 80%; /* Define uma largura relativa mais fixa no mobile */
  }

  .spinner {
    width: 40px;
    height: 40px;
    border-width: 4px; /* Afina a borda para manter a proporção */
  }

  p {
    font-size: 1rem;
  }
}
</style>
