import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('global search tolerates a stray space and finds the dossier', async ({ page }) => {
  await login(page);
  await page.getByRole('searchbox').fill('1 0 1');
  await expect(page.getByText('Kovacs Barna Stefan')).toBeVisible();
});
