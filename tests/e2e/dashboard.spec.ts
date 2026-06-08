import { test, expect } from '@playwright/test';

test('dashboard shows the four KPIs from seeded data', async ({ page }) => {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');

  // KPI titles.
  await expect(page.getByText('Suprafață administrată')).toBeVisible();
  await expect(page.getByText('Valoare patrimoniu')).toBeVisible();

  // Grain stock breakdown lists crops.
  await expect(page.getByText('Grâu')).toBeVisible();

  // The expiring lease (within 60 days) surfaces in urgent alerts.
  await expect(page.getByText('Ionescu Vasile')).toBeVisible();
});
