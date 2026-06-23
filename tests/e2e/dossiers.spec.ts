import { test, expect, type Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('dossier list shows seeded dossiers and links to detail', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  await expect(page.getByText('Kovacs Barna Stefan')).toBeVisible();
  await page.getByRole('link', { name: '101' }).click();
  await expect(page).toHaveURL(/\/dossiers\//);
});

test('uploading a document shows it, with no delete control (CF-4)', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  await page.getByRole('link', { name: '101' }).click();
  await expect(page).toHaveURL(/\/dossiers\//);

  await page.locator('input[type="file"]').setInputFiles({
    name: 'extras-cf.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4 test scan'),
  });
  await page.getByRole('button', { name: 'Încarcă document' }).click();

  await expect(page.getByText('extras-cf.pdf')).toBeVisible();
  // CF-4: the document area exposes no delete affordance.
  await expect(page.getByRole('button', { name: /Șterge|Delete/i })).toHaveCount(0);
});
