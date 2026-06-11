import { test, expect } from '@playwright/test';

test('Verify Member to Admin Chat', async ({ page }) => {
  // Wait longer for elements to load
  test.setTimeout(60000);

  console.log("Navigating to frontend...");
  await page.goto('http://localhost:8080/');

  // Member Login
  console.log("Logging in as member...");
  await page.fill('input[type="email"]', 'test@member.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Log in")');

  // Verify dashboard
  await expect(page.locator('text=Welcome, Test')).toBeVisible({ timeout: 10000 });
  
  // Go to Messages
  console.log("Navigating to messages...");
  // Attempt to select the messages link from the sidebar or recent messages
  await page.goto('http://localhost:8080/member/messages');
  
  // Wait for contacts
  await expect(page.locator('text=Contacts')).toBeVisible({ timeout: 10000 });

  console.log("Clicking on Admin contact...");
  // Click on admin user in the list
  await page.click('button:has-text("Admin")');
  
  console.log("Sending message...");
  // Type a message to Admin
  await page.fill('input[placeholder="Message Admin…"]', 'Playwright Integration Test!');
  await page.keyboard.press('Enter');

  // Verify message is in the DOM
  await expect(page.locator('text=Playwright Integration Test!')).toBeVisible({ timeout: 10000 });
  console.log("Message successfully rendered in DOM!");

  console.log("Test Passed!");
});
