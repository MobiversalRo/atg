import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('admin sees seeded properties and the portfolio total', async ({ page }) => {
  await login(page);
  await page.goto('/ro/properties');

  await expect(page.getByRole('heading', { name: 'Proprietăți' })).toBeVisible();
  await expect(page.getByText('Valoare totală portofoliu')).toBeVisible();
  await expect(page.getByText('Siloz Cerealier 1')).toBeVisible();
  await expect(page.getByText('Apartament Centru')).toBeVisible();
});

test('filtering by asset type narrows the table', async ({ page }) => {
  await login(page);
  await page.goto('/ro/properties');

  await page.getByLabel('Tip activ').selectOption('agricultural_land');
  await expect(page.getByText('Teren Agricol Vest')).toBeVisible();
  await expect(page.getByText('Apartament Centru')).toHaveCount(0);
});
