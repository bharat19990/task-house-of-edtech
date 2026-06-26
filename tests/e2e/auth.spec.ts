import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('should show register page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('Sign Up')).toBeVisible();
    await expect(page.locator('#register-name')).toBeVisible();
    await expect(page.locator('#register-email')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
  });

  test('should navigate between login and register', async ({ page }) => {
    await page.goto('/login');
    await page.locator('a:has-text("Create one")').click();
    await expect(page).toHaveURL(/register/);

    await page.locator('a:has-text("Sign in")').click();
    await expect(page).toHaveURL(/login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('invalid@test.com');
    await page.locator('#login-password').fill('wrongpassword');
    await page.locator('button[type="submit"]:has-text("Sign In")').click();

    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('should redirect unauthenticated user from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    await expect(page).toHaveURL(/login/, { timeout: 5000 });
  });
});
