// tests/automated_e2e.mjs
import { chromium } from 'playwright';

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  const results = {
    registration: "PENDING",
    howItWorks: "PENDING",
    priceCheck: "PENDING",
    adminDelete: "PENDING"
  };

  try {
    console.log("🚀 Starting E2E Tests on http://188.132.230.231:3001");
    page.setDefaultTimeout(60000);
    
    // 1. Home Page & How It Works Navigation
    await page.goto('http://188.132.230.231:3001', { waitUntil: 'domcontentloaded' });
    console.log("✅ Home page loaded");
    
    await page.click('text=How It Works');
    await page.waitForTimeout(1000);
    if (page.url().includes('how-it-works')) {
       console.log("✅ How It Works page navigation successful");
       results.howItWorks = "OK";
    }

    // 2. Role Switch Test
    await page.click('text=I’m a Teacher');
    await page.waitForTimeout(1000);
    if (page.url().includes('role=teacher')) {
        console.log("✅ Role switch to Teacher successful");
    }

    // 3. Intro Price Check in How It Works (Reveal descriptions)
    await page.goto('http://188.132.230.231:3001/how-it-works?role=student');
    const infoButtons = await page.$$('button:has-text("ⓘ")');
    if (infoButtons.length > 0) {
        await infoButtons[0].click(); // Reveal Step 1
        await page.waitForTimeout(500);
        const revealedText = await page.innerText('body');
        if (revealedText.includes('£4.99')) {
            console.log("✅ Intro price £4.99 verified in revealed Step 1");
            results.priceCheck = "OK";
        }
    }

    // 4. Student Registration UI Check
    await page.goto('http://188.132.230.231:3001/student/register');
    const regTitle = await page.innerText('h1');
    if (regTitle.includes('Create your account')) {
        console.log("✅ Student registration UI verified");
        results.registration = "OK";
    }

    // 5. Minor Flow Check (UI only)
    await page.fill('input[name="birthday"]', '2010-01-01'); // 16 years old
    const parentEmailField = await page.isVisible('input[name="parentEmail"]');
    if (parentEmailField) {
        console.log("✅ Minor flow (Parent Email field) triggered successfully at age 16");
    }

    console.log("\n--- TEST SUMMARY ---");
    console.log(JSON.stringify(results, null, 2));

  } catch (error) {
    console.error("❌ Test Failed:", error);
  } finally {
    await browser.close();
  }
}

runTests();
