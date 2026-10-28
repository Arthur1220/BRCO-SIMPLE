import { test, expect } from '@playwright/test';
import { ADMIN_PASSWORD } from './playwright.config.js';

// Painel: avisos de consistência do cadastro e histórico com o nome de quem alterou.

test('admin: avisos do cadastro e histórico de alterações', async ({ page }) => {
  await page.goto('/admin');
  await page.getByLabel('Seu nome').fill('Professora E2E');
  await page.getByLabel('Senha').fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Entrar' }).click();

  const foods = page.getByRole('region', { name: 'Alimentos cadastrados' });
  // O feno de Tifton do seed tem composição que não fecha com a MO.
  await expect(foods.getByRole('row', { name: /Feno de Tifton/ })).toContainText('1 aviso(s)');

  // Suplemento sem cobre: aviso some ao informar o Cu e a espécie de destino
  await foods.getByRole('row', { name: /Supra Sal/ }).getByRole('button', { name: 'Editar' }).click();
  const form = page.getByRole('dialog', { name: 'Editar alimento' });
  await form.getByLabel('Mo (mg/kg MS)', { exact: true }).fill('1');
  await expect(form.getByRole('status')).toContainText('Suplemento sem teor de cobre');
  await form.getByLabel('Cu (mg/kg MS)', { exact: true }).fill('10');
  await form.getByLabel('Espécie de destino (suplementos)').selectOption('OVINO');
  await expect(form.getByRole('status')).toHaveCount(0);
  await form.getByRole('button', { name: 'Salvar' }).click();
  await expect(form).toBeHidden();

  await foods.getByRole('row', { name: /Supra Sal/ }).getByRole('button', { name: 'Histórico' }).click();
  const history = page.getByRole('dialog', { name: 'Histórico de Supra Sal' });
  await expect(history).toContainText('Alteração');
  await expect(history).toContainText('Professora E2E');
  await expect(history.getByRole('row', { name: /^Cu/ })).toContainText('10');
});
