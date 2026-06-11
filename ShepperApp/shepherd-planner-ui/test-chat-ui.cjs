const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Mt Alin\\.gemini\\antigravity\\brain\\45764710-7a02-4177-a8ad-b2a320d1c2b9';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // ==============================
  // MEMBER FLOW
  // ==============================
  console.log('Testing Member Chat Flow...');
  const memberContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const memberPage = await memberContext.newPage();
  
  await memberPage.goto('http://localhost:8080/');
  
  // Login
  await memberPage.fill('input[type="email"]', 'test@member.com');
  await memberPage.fill('input[type="password"]', 'password123');
  await memberPage.click('button:has-text("Log in")');
  
  // Wait for Dashboard to settle
  await memberPage.waitForSelector('text=Welcome, Test');
  
  // Go to Messages
  await memberPage.goto('http://localhost:8080/member/messages');
  
  // Find Admin and click
  await memberPage.waitForSelector('text=Admin');
  await memberPage.click('text=Admin');
  
  // Send Message
  const inputSelector = 'input[placeholder="Message Admin…"]';
  await memberPage.waitForSelector(inputSelector);
  await memberPage.fill(inputSelector, 'Hello Admin! This is a visual test message from the frontend! It works!');
  await memberPage.keyboard.press('Enter');
  
  // Wait a second for message to render and poll via websocket/react-query
  await memberPage.waitForTimeout(1500);
  
  // Screenshot Member UI
  const memberShotPath = path.join(ARTIFACTS_DIR, 'member_chat.png');
  await memberPage.screenshot({ path: memberShotPath });
  console.log(`Saved member screenshot to ${memberShotPath}`);
  
  await memberContext.close();
  
  // ==============================
  // ADMIN FLOW
  // ==============================
  console.log('Testing Admin Chat Flow...');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const adminPage = await adminContext.newPage();
  
  await adminPage.goto('http://localhost:8080/');
  
  // Login
  await adminPage.fill('input[type="email"]', 'admin@church.org');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button:has-text("Log in")');
  
  // Wait for Dashboard
  await adminPage.waitForSelector('text=Quick Actions');
  
  // Go to Messages
  await adminPage.goto('http://localhost:8080/admin/messages');
  
  // It uses the same backend so the admin UI might just have "Test Member Updated" or "Test Member"
  // Let's just click the first contact that is not the input (search)
  await adminPage.waitForTimeout(1000);
  
  // Click on "Test Member" in the contact list
  try {
    await adminPage.click('text=Test Member');
  } catch (e) {
    // If name changed
    await adminPage.click('text=Test Member Updated');
  }
  
  // Reply
  const adminInput = 'input[placeholder="Type a message..."]';
  await adminPage.waitForSelector(adminInput);
  await adminPage.fill(adminInput, 'Hello Member! I am receiving your messages perfectly. This looks great!');
  await adminPage.keyboard.press('Enter');
  
  // Wait a bit
  await adminPage.waitForTimeout(1500);
  
  // Screenshot Admin UI
  const adminShotPath = path.join(ARTIFACTS_DIR, 'admin_chat.png');
  await adminPage.screenshot({ path: adminShotPath });
  console.log(`Saved admin screenshot to ${adminShotPath}`);
  
  await adminContext.close();
  await browser.close();
  console.log('Browser test complete!');
})();
