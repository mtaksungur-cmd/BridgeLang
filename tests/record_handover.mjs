// tests/record_handover.mjs
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const videoDir = '/root/.openclaw/workspace/bridgelang_temp/videos/handover';
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

async function recordFlows() {
  console.log("🎬 Starting Handover Recording...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: {
      dir: videoDir,
      size: { width: 1280, height: 720 }
    },
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();
  
  try {
    // FLOW 1: Home and Navigation
    await page.goto('http://188.132.230.231:3001');
    await page.waitForTimeout(2000);
    console.log("✅ Home recorded");

    // FLOW 2: How It Works & Interactive Steps
    await page.click('text=How It Works');
    await page.waitForTimeout(2000);
    const infoBtn = page.locator('button:has-text("ⓘ")').first();
    await infoBtn.click();
    await page.waitForTimeout(2000);
    console.log("✅ How It Works (Premium) recorded");

    // FLOW 3: Browse Teachers (Premium Grid)
    await page.goto('http://188.132.230.231:3001/student/teachers');
    await page.waitForTimeout(3000);
    console.log("✅ Tutors Grid recorded");

    // FLOW 4: Student Register
    await page.goto('http://188.132.230.231:3001/student/register');
    await page.fill('input[name="name"]', 'Arthur Handover Test');
    await page.fill('input[name="email"]', `arthur_${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'ArthurSafe123');
    await page.waitForTimeout(2000);
    console.log("✅ Registration UI recorded");

  } catch (err) {
    console.error("❌ Recording Error:", err);
  } finally {
    await context.close();
    await browser.close();
    console.log("🎬 Recording Finished. Video saved in:", videoDir);
  }
}

recordFlows();
