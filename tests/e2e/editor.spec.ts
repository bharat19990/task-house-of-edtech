import { test, expect } from '@playwright/test';

test.describe('Editor', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/editor/test-doc-id');
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });

  test('should show the landing page', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveURL(/login|dashboard/, { timeout: 5000 });
  });
});
