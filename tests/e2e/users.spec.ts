import { test, expect } from '@playwright/test';

async function loginAs(page: import('@playwright/test').Page, email: string) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('the user menu opens without crashing', async ({ page }) => {
  await loginAs(page, 'admin@atg.local');
  await page.getByRole('button', { name: 'Account' }).click();
  await expect(page.getByText('Deconectare')).toBeVisible();
});

test('admin can create, edit, and delete a user', async ({ page }) => {
  await loginAs(page, 'admin@atg.local');
  await page.goto('/ro/users');
  await expect(page.getByText('admin@atg.local')).toBeVisible();

  // Create
  await page.getByRole('button', { name: 'Adaugă utilizator' }).click();
  await page.getByLabel('Email', { exact: true }).fill('crud.user@atg.local');
  await page.getByLabel('Nume complet').fill('CRUD User');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Salvează' }).click();
  // Wait for the slide-over (and its backdrop) to close before touching the table.
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByText('crud.user@atg.local')).toBeVisible();

  // Edit role -> manager
  const row = page.getByRole('row').filter({ hasText: 'crud.user@atg.local' });
  await row.getByRole('button', { name: 'Editează' }).click();
  // exact: true — "Rol" is a substring of "Parolă", so a loose match is ambiguous.
  await page.getByLabel('Rol', { exact: true }).selectOption('manager');
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row.getByText('Manager')).toBeVisible();

  // Delete
  await row.getByRole('button', { name: 'Șterge' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Șterge' }).click();
  await expect(page.getByText('crud.user@atg.local')).toHaveCount(0);
});

test('operators are redirected away from the users page', async ({ page }) => {
  await loginAs(page, 'operator@atg.local');
  await page.goto('/ro/users');
  await page.waitForURL('**/ro');
  await expect(page.getByRole('heading', { name: 'Panou principal' })).toBeVisible();
});
