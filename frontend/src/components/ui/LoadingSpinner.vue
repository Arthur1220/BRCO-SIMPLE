<template>
  <div class="spinner-overlay">
    <div class="spinner"></div>
    <p>Calculando...</p>
  </div>
</template>

<style scoped>
.spinner-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}
.spinner {
  border: 5px solid var(--grey-light);
  border-top: 5px solid var(--orange);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
}
.spinner-overlay p {
  margin-top: 1.5rem;
  font-weight: bold;
  color: var(--black);
  font-size: 1.1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>