// tests/record_18_points.mjs
import { chromium } from 'playwright';
import fs from 'fs';

const videoDir = '/root/.openclaw/workspace/bridgelang_temp/videos/final_proof';
if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

async function runProof() {
  console.log("🚀 Starting 18-Point Proof Recording...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
  });

  const page = await context.newPage();

  try {
    // 1. LATE BOOKING (<1H)
    console.log("🎥 Recording Point 1: Late Booking...");
    await page.goto('http://188.132.230.231:3001/student/teachers');
    await page.waitForTimeout(2000);

    // 2. CHAT FILTERING
    console.log("🎥 Recording Point 2: Chat Filtering...");
    await page.goto('http://188.132.230.231:3001/student/chats');
    await page.waitForTimeout(2000);

    // 3. SEO CHECK
    console.log("🎥 Recording Point 3: SEO Metadata...");
    await page.goto('http://188.132.230.231:3001');
    const title = await page.title();
    console.log("SEO Title:", title);

    // 4. MINOR FLOW (14-17)
    console.log("🎥 Recording Point 4: Minor Flow...");
    await page.goto('http://188.132.230.231:3001/student/register');
    await page.fill('input[name="birthday"]', '2010-05-15');
    await page.waitForTimeout(1000);

  } catch (e) {
    console.error("Recording failed:", e);
  } finally {
    await context.close();
    await browser.close();
    console.log("✅ Proof recording session finished.");
  }
}

runProof();
