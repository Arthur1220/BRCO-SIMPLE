<template>
  <div class="spinner-overlay">
    <div class="spinner-card">
      <div class="spinner"></div>
      <p>Processando...</p>
    </div>
  </div>
</template>

<style scoped>
.spinner-overlay {
  position: fixed;
  /* O SEGREDO: inset: 0 fixa o elemento nos 4 cantos da tela (topo, baixo, esq, dir).
     Isso garante tela cheia sem estourar a rolagem e funciona em mobile com barra de endereços. */
  inset: 0;
  z-index: 9999;
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  /* Previne rolagem do conteúdo atrás */
  overscroll-behavior: contain;
}

.spinner-card {
  background: #ffffff;
  padding: 2rem 3rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--grey-light);
  /* Responsividade segura */
  max-width: 90%;
  width: auto;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid var(--orange);
  border-radius: 50%;
  animation: spin 1s cubic-bezier(0.55, 0.055, 0.675, 0.19) infinite;
}

p {
  margin: 0;
  font-weight: 600;
  color: var(--black);
  font-size: 1.1rem;
  letter-spacing: 0.5px;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* --- RESPONSIVIDADE --- */
@media (max-width: 600px) {
  .spinner-card {
    padding: 1.5rem 2rem;
    border-radius: 12px;
    width: 80%;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border-width: 4px;
  }

  p {
    font-size: 1rem;
  }
}
</style>
