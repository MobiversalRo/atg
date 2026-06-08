import { test, expect } from '@playwright/test';

const STATUSES = ['gate', 'scale', 'dock', 'exited'] as const;

async function login(page: import('@playwright/test').Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('yard board renders the four columns and seeded trucks', async ({ page }) => {
  await login(page);
  await page.goto('/ro/yard');

  await expect(page.getByText('Poartă')).toBeVisible();
  await expect(page.getByText('Ieșit')).toBeVisible();
  await expect(page.getByText('CJ-45-XYZ')).toBeVisible();
  await expect(page.getByText('B-123-ATG')).toBeVisible();
});

test('dragging a truck card moves it to a new column and persists', async ({ page }) => {
  await login(page);
  await page.goto('/ro/yard');

  const plate = 'CJ-45-XYZ';
  await expect(page.locator(`[data-plate="${plate}"]`)).toBeVisible();

  // Find the truck's current column, then pick a different target (robust to prior runs).
  let current: (typeof STATUSES)[number] = STATUSES[0];
  for (const s of STATUSES) {
    if (await page.getByTestId(`col-${s}`).locator(`[data-plate="${plate}"]`).count()) {
      current = s;
      break;
    }
  }
  const target = STATUSES.find((s) => s !== current)!;

  const grip = page
    .getByTestId(`col-${current}`)
    .locator(`[data-plate="${plate}"]`)
    .getByRole('button', { name: 'Mută' });
  const gripBox = await grip.boundingBox();
  const targetBox = await page.getByTestId(`col-${target}`).boundingBox();
  if (!gripBox || !targetBox) throw new Error('missing bounding boxes');

  await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(gripBox.x + 30, gripBox.y + 30, { steps: 5 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 60, { steps: 12 });

  const writePromise = page.waitForResponse((r) => r.request().method() === 'POST');
  await page.mouse.up();

  await expect(page.getByTestId(`col-${target}`).locator(`[data-plate="${plate}"]`)).toBeVisible();
  await writePromise;

  // Persisted across a reload.
  await page.reload();
  await expect(page.getByTestId(`col-${target}`).locator(`[data-plate="${plate}"]`)).toBeVisible();
});

test('a truck can be created, edited, and deleted', async ({ page }) => {
  await login(page);
  await page.goto('/ro/yard');

  // Create
  await page.getByRole('button', { name: 'Adaugă camion' }).click();
  await page.getByLabel('Număr înmatriculare').fill('TEST-CRUD-1');
  await page.getByLabel('Șofer').fill('Test Driver');
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.locator('[data-plate="TEST-CRUD-1"]')).toBeVisible();

  // Edit (rename via the card actions menu)
  await page.locator('[data-plate="TEST-CRUD-1"]').getByRole('button', { name: 'Acțiuni' }).click();
  await page.getByRole('menuitem', { name: 'Editează' }).click();
  await page.getByLabel('Număr înmatriculare').fill('TEST-CRUD-2');
  await page.getByRole('button', { name: 'Salvează' }).click();
  await expect(page.locator('[data-plate="TEST-CRUD-2"]')).toBeVisible();
  await expect(page.locator('[data-plate="TEST-CRUD-1"]')).toHaveCount(0);

  // Delete (confirm in the dialog)
  await page.locator('[data-plate="TEST-CRUD-2"]').getByRole('button', { name: 'Acțiuni' }).click();
  await page.getByRole('menuitem', { name: 'Șterge' }).click();
  await page.getByRole('button', { name: 'Șterge' }).click();
  await expect(page.locator('[data-plate="TEST-CRUD-2"]')).toHaveCount(0);
});
