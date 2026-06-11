import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  const context = browser.contexts()[0];
  const page = context.pages()[0];
  await page.screenshot({ path: 'c:/Users/Mt Alin/.gemini/antigravity/brain/a24c6555-aca0-4cc9-a6b3-0f94865422f5/manual_screenshot.png' });
  await browser.close();
}

run().catch(console.error);
