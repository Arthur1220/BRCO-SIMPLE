<template>
  <section class="panel login" aria-labelledby="login-title">
    <div class="panel-body">
      <h1 id="login-title">{{ $t('admin.login.title') }}</h1>
      <p>{{ $t('admin.login.text') }}</p>

      <form class="form" @submit.prevent="handleLogin">
        <div class="field">
          <label class="label" for="admin-password">{{ $t('admin.login.placeholder') }}</label>
          <input
            id="admin-password"
            v-model="password"
            class="input"
            :class="{ 'has-error': error }"
            type="password"
            autocomplete="current-password"
            required
            :aria-describedby="error ? 'login-error' : undefined"
          />
          <small v-if="error" id="login-error" class="field-error">{{ error }}</small>
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="isLoading">
          <span v-if="isLoading" class="spinner" aria-hidden="true"></span>
          {{ isLoading ? $t('admin.login.verifying') : $t('admin.login.submit') }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { loginAdmin } from '@/services/adminService';
import { parseApiError } from '@/services/axiosSetup';

const { t } = useI18n();
const password = ref('');
const isLoading = ref(false);
const error = ref(null);

const emit = defineEmits(['login-success']);

const handleLogin = async () => {
  isLoading.value = true;
  error.value = null;
  try {
    await loginAdmin(password.value);
    emit('login-success');
  } catch (err) {
    // Mensagem pronta da API (senha incorreta, muitas tentativas...)
    error.value = parseApiError(err, t('errors.login')).message;
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.login { max-width: 400px; margin: 48px auto 0; }
.login h1 { font-size: 1.375rem; margin-bottom: 6px; }
.login p { font-size: 0.875rem; margin-bottom: 20px; }
.form { display: flex; flex-direction: column; gap: 16px; }
</style>
