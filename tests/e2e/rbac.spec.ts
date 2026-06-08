import { test, expect } from '@playwright/test';

async function loginAs(page: import('@playwright/test').Page, email: string) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('operator can read properties but has no write controls', async ({ page }) => {
  await loginAs(page, 'operator@atg.local');
  await page.goto('/ro/properties');

  await expect(page.getByText('Siloz Cerealier 1')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Adaugă proprietate' })).toHaveCount(0);
});

test('operator keeps yard write access (can add trucks)', async ({ page }) => {
  await loginAs(page, 'operator@atg.local');
  await page.goto('/ro/yard');

  await expect(page.getByRole('button', { name: 'Adaugă camion' })).toBeVisible();
});

test('manager can add properties', async ({ page }) => {
  await loginAs(page, 'manager@atg.local');
  await page.goto('/ro/properties');

  await expect(page.getByRole('button', { name: 'Adaugă proprietate' })).toBeVisible();
});
