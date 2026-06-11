const { chromium } = require('playwright');
const path = require('path');

const ARTIFACTS_DIR = 'C:\\Users\\Mt Alin\\.gemini\\antigravity\\brain\\45764710-7a02-4177-a8ad-b2a320d1c2b9';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  
  // ==============================
  // MEMBER SENDS NEW MESSAGE
  // ==============================
  console.log('Member logs in to send an unread message...');
  const memberContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const memberPage = await memberContext.newPage();
  
  await memberPage.goto('http://localhost:8080/');
  await memberPage.fill('input[type="email"]', 'test@member.com');
  await memberPage.fill('input[type="password"]', 'password123');
  await memberPage.click('button:has-text("Log in")');
  
  await memberPage.waitForSelector('text=Welcome');
  await memberPage.goto('http://localhost:8080/member/messages');
  await memberPage.waitForSelector('text=Admin');
  await memberPage.click('text=Admin');
  
  const inputSelector = 'input[placeholder="Message Admin…"]';
  await memberPage.waitForSelector(inputSelector);
  await memberPage.fill(inputSelector, 'Look for the green bubble!!');
  await memberPage.keyboard.press('Enter');
  
  await memberPage.waitForTimeout(1000); // give time for message to process
  await memberContext.close();
  
  // ==============================
  // ADMIN SEES NOTIFICATION
  // ==============================
  console.log('Admin logs in to see the notification badge...');
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const adminPage = await adminContext.newPage();
  
  await adminPage.goto('http://localhost:8080/');
  await adminPage.fill('input[type="email"]', 'admin@church.org');
  await adminPage.fill('input[type="password"]', 'password123');
  await adminPage.click('button:has-text("Log in")');
  
  // Wait for Dashboard
  await adminPage.waitForSelector('text=Quick Actions');
  
  // Wait a few seconds for query to resolve unread count
  await adminPage.waitForTimeout(3000);
  
  // Screenshot Admin Dashboard with Badge
  const badgeShotPath = path.join(ARTIFACTS_DIR, 'notification_badge.png');
  await adminPage.screenshot({ path: badgeShotPath });
  console.log(`Saved badge screenshot to ${badgeShotPath}`);
  
  // ==============================
  // ADMIN READS MESSAGE (CLEARS BADGE)
  // ==============================
  console.log('Admin opens messages to clear the badge...');
  await adminPage.goto('http://localhost:8080/admin/messages');
  await adminPage.waitForTimeout(2000);
  
  try {
    await adminPage.click('text=Test Member');
  } catch (e) {
    await adminPage.click('text=Test Member Updated');
  }
  
  // Chat is open, PUT request should be made to clear the badge
  // Wait for react-query to invalidate and clear the bubble
  await adminPage.waitForTimeout(4000); 
  
  // Screenshot Admin Dashboard without Badge
  const clearedShotPath = path.join(ARTIFACTS_DIR, 'notification_cleared.png');
  await adminPage.screenshot({ path: clearedShotPath });
  console.log(`Saved cleared badge screenshot to ${clearedShotPath}`);
  
  await adminContext.close();
  await browser.close();
  console.log('Browser test complete!');
})();
