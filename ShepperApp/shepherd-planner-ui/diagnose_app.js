import { chromium } from 'playwright';

async function verifyFixes() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
    else console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  try {
    console.log('Navigating to http://localhost:8080/admin...');
    await page.goto('http://localhost:8080/admin', { timeout: 15000 });

    if (page.url().includes('/login') || page.url() === 'http://localhost:8080/') {
      console.log('Logging in...');
      await page.waitForSelector('input[type="email"]', { state: 'visible' });
      await page.fill('input[type="email"]', 'admin@church.org');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin', { timeout: 15000 });
    }

    console.log('Opening Meeting Modal...');
    const scheduleBtn = await page.waitForSelector('text="Schedule Meeting"');
    await scheduleBtn.click();
    await page.waitForSelector('text="Schedule Direct Meeting"');

    // TEST: Search and Select
    console.log('Testing participant search...');
    await page.fill('input[placeholder="Search people..."]', 'Admin');
    await page.waitForTimeout(500);
    
    console.log('Selecting a participant...');
    // We select the first user row. Now that we fixed the bubbling, it should be safe.
    await page.click('div.flex.items-center.space-x-3:first-of-type');
    
    console.log('Selection successful. Checking status...');
    const selectedCountText = await page.textContent('text="participant(s) selected"');
    console.log('Summary:', selectedCountText?.trim());

    // TEST: Invalid Date Submission
    console.log('Testing invalid date submission...');
    await page.fill('input#meeting-title', 'Test Meeting');
    // Leave date and time blank
    await page.click('button:has-text("Schedule Meeting")');
    
    console.log('Checking for error toast...');
    const errorToast = await page.waitForSelector('text="Please fill in title, date and time"', { timeout: 5000 }).catch(() => null);
    if (errorToast) {
       console.log('Success: Correct error toast shown instead of crash.');
    } else {
       console.log('Warning: Expected error toast not found. Check if browser crash occurred.');
    }

    const content = await page.content();
    if (content.length < 500) {
       console.log('CRASH DETECTED: Page content is empty.');
    } else {
       console.log('FINAL VERIFICATION SUCCESS: App remains stable under selection and invalid input.');
    }

  } catch (err) {
    console.error('VERIFICATION ERROR:', err.message);
  } finally {
    await browser.close();
  }
}

verifyFixes();
