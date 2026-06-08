import { test, expect } from '@playwright/test';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/ro/login');
  await page.getByLabel('Email').fill('admin@atg.local');
  await page.getByLabel('Parolă').fill('password123');
  await page.getByRole('button', { name: 'Autentificare' }).click();
  await page.waitForURL('**/ro');
}

test('farm shows parcels, the lease expiry alert, and SiloBoard fill', async ({ page }) => {
  await login(page);
  await page.goto('/ro/farm');

  // Parcels tab is the default.
  await expect(page.getByText('Topo 45')).toBeVisible();

  // Leases tab — the lease expiring within 60 days is flagged.
  await page.getByRole('tab', { name: 'Arende' }).click();
  await expect(page.getByText('Ionescu Vasile')).toBeVisible();
  await expect(page.getByText(/Expiră în/)).toBeVisible();

  // SiloBoard tab — Siloz 1 holds 3000/5000 t = 60%.
  await page.getByRole('tab', { name: 'SiloBoard' }).click();
  await expect(page.getByText('60%')).toBeVisible();
  await expect(
    page.locator('[data-slot="card-title"]', { hasText: 'Siloz 1' }),
  ).toBeVisible();
});
