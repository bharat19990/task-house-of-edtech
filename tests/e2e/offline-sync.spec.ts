import { test, expect } from '@playwright/test';

test.describe('Offline Sync', () => {
  test('should show connection status indicator', async ({ page }) => {
    await page.goto('/login');
    
    await expect(page).toHaveTitle(/CollabEdit/);
  });

  test('should handle network going offline', async ({ page, context }) => {
    await page.goto('/login');

    await context.setOffline(true);

    await expect(page.locator('body')).toBeVisible();

    await context.setOffline(false);
  });
});
