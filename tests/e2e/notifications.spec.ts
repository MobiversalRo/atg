import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('admin generates a lease notification and marks it read (CF-8)', async ({ page }) => {
  await login(page);
  await page.getByRole('button', { name: 'Notificări' }).click();
  await page.getByRole('button', { name: 'Verifică scadențe' }).click();

  const item = page.getByText(/Arendă scadentă curând|Arendă restantă/);
  await expect(item.first()).toBeVisible();

  await page.getByRole('button', { name: 'Marchează citit' }).first().click();
  await expect(page.getByText(/Arendă scadentă curând|Arendă restantă/)).toHaveCount(0);
});
