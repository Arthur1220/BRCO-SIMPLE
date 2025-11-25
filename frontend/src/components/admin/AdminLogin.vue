<template>
  <div class="login-box">
    <h2>Acesso Restrito</h2>
    <p>Por favor, insira a senha para acessar o painel administrativo.</p>
    <form @submit.prevent="handleLogin">
      <input
        v-model="password"
        type="password"
        placeholder="Senha do painel"
        required
      />
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Verificando...' : 'Entrar' }}
      </button>
      <p v-if="error" class="error-message">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { loginAdmin } from '@/services/adminService';

const password = ref('');
const isLoading = ref(false);
const error = ref(null);

const emit = defineEmits(['login-success']);

const handleLogin = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    const response = await loginAdmin(password.value);
    if (response.success) {
      sessionStorage.setItem('isAdminAuthenticated', 'true');
      emit('login-success');
    }
  } catch (err) {
    error.value = 'Senha incorreta. Tente novamente.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login-box {
  width: 100%;
  max-width: 400px;
  padding: 2rem 2.5rem;
  background-color: var(--white);
  border-radius: 12px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.1);
  text-align: center;
  margin: 4rem auto;
}

h2 {
  color: var(--orange);
  margin-bottom: 0.5rem;
}

p {
  color: var(--black-light);
  margin-bottom: 2rem;
}

input[type="password"] {
  width: 100%;
  padding: 0.8rem;
  border: 1px solid var(--grey);
  border-radius: 5px;
  font-size: 1rem;
  margin-bottom: 1rem;
}

button {
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  background-color: var(--orange);
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.error-message {
  color: var(--red-error);
  margin-top: 1rem;
  font-weight: bold;
}
</style>
