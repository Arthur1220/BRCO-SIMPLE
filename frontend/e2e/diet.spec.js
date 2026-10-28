import fs from 'node:fs';
import { test, expect } from '@playwright/test';

// Fluxo principal da dieta: animal → alimentos → preços e lote → resultado → PDF.

async function fillAnimal(page) {
  await page.goto('/formulacao-dieta');
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByText('Ovino', { exact: true }).click();
  await page.getByLabel('Peso corporal inicial').fill('25');
  await page.getByLabel('Peso corporal final').fill('35');
  await page.getByLabel('Ganho médio diário').fill('200');
  await page.getByRole('button', { name: 'Continuar' }).click();
}

async function chooseFoods(page, names) {
  for (const name of names) await page.getByRole('button', { name, exact: true }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();
}

async function setPrice(page, food, value) {
  await page.getByLabel(`Preço · ${food}`).fill(String(value));
}

test('dieta completa: trato do lote, travas, custo e PDF personalizado', async ({ page }) => {
  await fillAnimal(page);
  await chooseFoods(page, ['Silagem de milho', 'Milho fubá', 'Farelo de soja', 'Calcáreo']);

  // Preços por kg de matéria natural (padrão) e lote de 20 animais
  await expect(page.getByText('kg de matéria natural (como compra)')).toBeVisible();
  await page.getByLabel('Animais no lote').fill('20');
  await setPrice(page, 'Silagem de milho', 0.12);
  await setPrice(page, 'Milho fubá', 1.1);
  await setPrice(page, 'Farelo de soja', 2.2);
  await setPrice(page, 'Calcáreo', 0.5);
  await page.getByRole('button', { name: 'Calcular dieta' }).click();

  await expect(page.getByRole('heading', { name: 'Dieta formulada' })).toBeVisible();
  await expect(page.getByText('Exigências atendidas')).toBeVisible();
  await expect(page.getByText(/por kg de ganho/)).toBeVisible();

  const feeding = page.getByRole('region', { name: 'Trato do lote' });
  await expect(feeding).toContainText('20 animais · 2 tratos por dia');
  await expect(feeding.getByRole('row', { name: /Milho fubá/ })).toBeVisible();
  // Calcário por trato fica em gramas (não "0,00 kg")
  await expect(feeding.getByRole('row', { name: /Calcáreo/ })).toContainText(/\d+(,\d)? g/);

  const safety = page.getByRole('region', { name: 'Travas de segurança' });
  await expect(safety.getByRole('row', { name: /Relação cálcio:fósforo/ })).toContainText('Dentro');
  await expect(page.getByRole('region', { name: 'O que encarece a dieta' })).toBeVisible();

  // PDF com dados da propriedade e ficha de trato
  await page.getByRole('button', { name: 'Gerar PDF' }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Relatório em PDF' });
  await dialog.getByLabel('Propriedade').fill('Sítio Teste');
  await dialog.getByLabel('Lote', { exact: true }).fill('Lote 1');
  await dialog.getByLabel(/Ficha de trato/).check();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    dialog.getByRole('button', { name: 'Gerar PDF' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^formulacao-de-dieta-.*\.pdf$/);
  const pdf = fs.readFileSync(await download.path());
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.length).toBeGreaterThan(20_000);
});

test('sem fonte de cálcio, macho não recebe dieta e o motivo aparece', async ({ page }) => {
  await fillAnimal(page);
  await chooseFoods(page, ['Silagem de milho', 'Milho fubá', 'Farelo de soja']);
  await page.getByRole('button', { name: 'Calcular dieta' }).click();

  const modal = page.getByRole('dialog', { name: 'Não há solução que atenda tudo' });
  await expect(modal).toContainText('Não há dieta segura com estes alimentos');
  await expect(modal.getByText('Sem solução segura')).toHaveCount(2);
  await expect(modal.getByText(/Relação cálcio:fósforo/).first()).toBeVisible();
  await modal.getByRole('button', { name: 'Voltar e ajustar os alimentos' }).click();
  await expect(modal).toBeHidden();
});
