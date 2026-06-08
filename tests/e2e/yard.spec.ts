import { test, expect } from '@playwright/test';

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

  const card = page.locator('[data-plate="CJ-45-XYZ"]');
  const grip = card.getByRole('button', { name: 'Mută' });
  const target = page.getByTestId('col-dock');

  const gripBox = await grip.boundingBox();
  const targetBox = await target.boundingBox();
  if (!gripBox || !targetBox) throw new Error('missing bounding boxes');

  await page.mouse.move(gripBox.x + gripBox.width / 2, gripBox.y + gripBox.height / 2);
  await page.mouse.down();
  // Exceed the 5px activation distance, then move over the target column.
  await page.mouse.move(gripBox.x + 30, gripBox.y + 30, { steps: 5 });
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 60, { steps: 12 });

  // The drop fires the server action (a POST); wait for it before reloading.
  const writePromise = page.waitForResponse((r) => r.request().method() === 'POST');
  await page.mouse.up();

  await expect(page.getByTestId('col-dock').locator('[data-plate="CJ-45-XYZ"]')).toBeVisible();
  await writePromise;

  // Persisted across a reload.
  await page.reload();
  await expect(page.getByTestId('col-dock').locator('[data-plate="CJ-45-XYZ"]')).toBeVisible();
});
