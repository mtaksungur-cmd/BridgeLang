// tests/record_batch2.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const videoDir = '/root/.openclaw/workspace/bridgelang_temp/videos/final_proof';
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

async function runProof() {
  console.log("🚀 Starting 18-Point Proof Recording - Batch 2...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
  });

  const page = await context.newPage();

  try {
    // 5. PLAN UPGRADE/DOWNGRADE
    console.log("🎥 Recording Point 5: Plan Logic...");
    await page.goto('http://188.132.230.231:3001/student/subscription');
    await page.waitForTimeout(2000);

    // 6. ACCOUNT PAUSE/DELETE
    console.log("🎥 Recording Point 6: Account Management...");
    await page.goto('http://188.132.230.231:3001/account/settings');
    await page.waitForTimeout(2000);

    // 7. PRICING STANDALONE
    console.log("🎥 Recording Point 7: Standalone Pricing...");
    await page.goto('http://188.132.230.231:3001/pricing');
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error("Recording failed:", e);
  } finally {
    await context.close();
    await browser.close();
    console.log("✅ Batch 2 recording finished.");
  }
}

runProof();
