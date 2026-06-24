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

test('admin can create a dossier (CF-1)', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  const num = `TST-${Date.now()}`;
  await page.getByRole('button', { name: 'Adaugă dosar' }).click();
  await page.getByLabel('Număr dosar').fill(num);
  await page.getByLabel('Titular').fill('Test Holder');
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByRole('link', { name: num })).toBeVisible();
});
