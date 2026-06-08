import { test, expect } from '@playwright/test';

test('language dropdown switches the UI locale', async ({ page }) => {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');

  // Romanian heading by default.
  await expect(page.getByRole('heading', { name: 'Panou principal' })).toBeVisible();

  // Open the dropdown and choose English.
  await page.getByRole('button', { name: 'Language' }).click();
  await page.getByRole('menuitem', { name: 'English' }).click();

  await page.waitForURL('**/en');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});
