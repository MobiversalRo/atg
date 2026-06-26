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

test('admin can archive then restore a dossier (CF-4 soft-delete)', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  const num = `ARC-${Date.now()}`;
  await page.getByRole('button', { name: 'Adaugă dosar' }).click();
  await page.getByLabel('Număr dosar').fill(num);
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByRole('link', { name: num })).toBeVisible();

  // archive from the active list
  await page
    .getByRole('row', { name: new RegExp(num) })
    .getByRole('button', { name: 'Arhivează' })
    .click();
  await page.getByRole('dialog').getByRole('button', { name: 'Arhivează' }).click();
  await expect(page.getByRole('link', { name: num })).not.toBeVisible();

  // it now lives under the Archived tab — restore it
  await page.getByRole('tab', { name: /Arhivate/ }).click();
  await page
    .getByRole('row', { name: new RegExp(num) })
    .getByRole('button', { name: 'Restaurează' })
    .click();
  await expect(page.getByRole('link', { name: num })).not.toBeVisible();

  // and it is back under Active
  await page.getByRole('tab', { name: 'Active' }).click();
  await expect(page.getByRole('link', { name: num })).toBeVisible();
});

test('admin can edit a dossier (CF-1)', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  const num = `EDT-${Date.now()}`;
  await page.getByRole('button', { name: 'Adaugă dosar' }).click();
  await page.getByLabel('Număr dosar').fill(num);
  await page.getByLabel('Titular').fill('Before');
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByRole('link', { name: num })).toBeVisible();

  await page
    .getByRole('row', { name: new RegExp(num) })
    .getByRole('button', { name: 'Editează' })
    .click();
  await page.getByLabel('Titular').fill('After Edit');
  await page.getByRole('button', { name: 'Salvează' }).click();

  await expect(
    page.getByRole('row', { name: new RegExp(num) }).getByText('After Edit'),
  ).toBeVisible();
});

test('clicking a document row opens the edit pop-up and saves metadata (Req 4)', async ({ page }) => {
  await login(page);
  await page.goto('/ro/dossiers');
  await page.getByRole('link', { name: '101' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'meta-test.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4'),
  });
  await page.getByRole('button', { name: 'Încarcă document' }).click();
  await expect(page.getByText('meta-test.pdf')).toBeVisible();

  await page.getByRole('cell', { name: 'meta-test.pdf' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  const nr = `NR-${Date.now()}`;
  await dialog.getByLabel('Număr').fill(nr);
  await dialog.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.getByText(nr)).toBeVisible();
});
