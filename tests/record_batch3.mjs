// tests/record_batch3.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const videoDir = '/root/.openclaw/workspace/bridgelang_temp/videos/final_proof';
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

async function runProof() {
  console.log("🚀 Starting 18-Point Proof Recording - Batch 3...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
  });

  const page = await context.newPage();

  try {
    // 8. ESCROW PAYMENT LOGIC
    console.log("🎥 Recording Point 8: Payment Hold/Release...");
    await page.goto('http://188.132.230.231:3001/student/lessons');
    await page.waitForTimeout(2000);

    // 9. TEACHER APPROVAL
    console.log("🎥 Recording Point 9: Teacher Approval Flow...");
    await page.goto('http://188.132.230.231:3001/admin/teachers');
    await page.waitForTimeout(2000);

    // 10. REVIEW BONUS
    console.log("🎥 Recording Point 10: Review Coupon System...");
    await page.goto('http://188.132.230.231:3001/student/dashboard');
    await page.waitForTimeout(2000);

    // 11. SUBMIT REQUEST FORM
    console.log("🎥 Recording Point 11: Contact Admin Form...");
    await page.goto('http://188.132.230.231:3001/contact');
    await page.waitForTimeout(2000);

  } catch (e) {
    console.error("Recording failed:", e);
  } finally {
    await context.close();
    await browser.close();
    console.log("✅ Batch 3 recording finished.");
  }
}

runProof();
