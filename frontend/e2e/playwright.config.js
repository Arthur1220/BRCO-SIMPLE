import { defineConfig, devices } from '@playwright/test';

/*
 * Testes de ponta a ponta: navegador real contra a API local e o DynamoDB Local.
 * Pré-requisito: DynamoDB Local rodando (`docker compose up -d` na raiz; porta em DYNAMODB_ENDPOINT).
 * Cada execução usa tabelas novas (prefixo com data/hora), criadas e preenchidas com o seed.
 */
const API_PORT = Number(process.env.E2E_API_PORT || 3199);
const WEB_PORT = Number(process.env.E2E_WEB_PORT || 5199);
const prefix = `e2e-${Date.now()}`;

export const ADMIN_PASSWORD = 'senha-e2e';

const apiEnv = {
  NODE_ENV: 'development',
  PORT: String(API_PORT),
  DYNAMODB_ENDPOINT: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  AWS_REGION: 'sa-east-1',
  FOODS_TABLE: `${prefix}-foods`,
  CALCULATIONS_TABLE: `${prefix}-calculations`,
  USAGE_LOGS_TABLE: `${prefix}-usage-logs`,
  FOOD_HISTORY_TABLE: `${prefix}-food-history`,
  PANEL_PASSWORD: ADMIN_PASSWORD,
  ADMIN_JWT_SECRET: 'segredo-e2e-com-pelo-menos-32-caracteres!!',
  NETLIFY_PROXY_SECRET: '',
  LOG_LEVEL: 'warn',
};

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    locale: 'pt-BR',
    trace: 'retain-on-failure',
    ...devices['Desktop Chrome'],
  },
  webServer: [
    {
      command: 'node scripts/create-tables.js && node scripts/seed-foods.js && node index.js',
      cwd: '../../backend',
      env: apiEnv,
      url: `http://localhost:${API_PORT}/`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      cwd: '..',
      env: { API_PROXY_TARGET: `http://localhost:${API_PORT}` },
      url: `http://localhost:${WEB_PORT}`,
      timeout: 60_000,
      reuseExistingServer: false,
    },
  ],
});
