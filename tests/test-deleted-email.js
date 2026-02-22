/**
 * Test: Silinen e-posta ile tekrar kayıt engeli
 */

const admin = require('firebase-admin');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

// ── Firebase Admin init ──
const jsonPath = path.resolve(__dirname, '..', 'firebase-service-account.json');
if (!fs.existsSync(jsonPath)) {
  console.error('firebase-service-account.json bulunamadı!');
  process.exit(1);
}

if (admin.apps.length === 0) {
  admin.initializeApp({ credential: admin.credential.cert(jsonPath) });
}

const db = admin.firestore();
const auth = admin.auth();

// ── Test config ──
const TEST_EMAIL = `test-deleted-${Date.now()}@bridgelang-test.com`;
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Test Deleted User';

let testUid = null;
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function cleanup() {
  console.log('\n🧹 Temizlik...');
  if (testUid) {
    try { await auth.deleteUser(testUid); } catch (e) {}
    try { await db.collection('users').doc(testUid).delete(); } catch (e) {}
  }
  const emailHash = crypto.createHash('sha256').update(TEST_EMAIL).digest('hex');
  try { await db.collection('deletedEmails').doc(emailHash).delete(); } catch (e) {}
  console.log('  Temizlik tamamlandı.');
}

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  Silinen E-posta Engeli Test Suite');
  console.log('═══════════════════════════════════════════');
  console.log(`  Test e-posta: ${TEST_EMAIL}\n`);

  try {
    // ── TEST 1: Kullanıcı oluştur ──
    console.log('📋 Test 1: Firebase Auth kullanıcı oluşturma');
    const userRecord = await auth.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      displayName: TEST_NAME,
    });
    testUid = userRecord.uid;
    assert(!!testUid, `Kullanıcı oluşturuldu (uid: ${testUid})`);

    // ── TEST 2: Firestore'a kaydet ──
    console.log('\n📋 Test 2: Firestore user kaydı oluşturma');
    await db.collection('users').doc(testUid).set({
      name: TEST_NAME,
      email: TEST_EMAIL,
      role: 'student',
      subscriptionPlan: 'free',
      createdAt: new Date(),
    });
    const userSnap = await db.collection('users').doc(testUid).get();
    assert(userSnap.exists, 'Firestore user kaydı oluşturuldu');
    assert(userSnap.data().email === TEST_EMAIL, 'E-posta doğru kaydedildi');

    // ── TEST 3: E-posta henüz deletedEmails'de olmamalı ──
    console.log('\n📋 Test 3: Silme öncesi deletedEmails kontrolü');
    const emailHash = crypto.createHash('sha256').update(TEST_EMAIL).digest('hex');
    const beforeSnap = await db.collection('deletedEmails').doc(emailHash).get();
    assert(!beforeSnap.exists, 'E-posta henüz deletedEmails koleksiyonunda yok');

    // ── TEST 4: Hesabı sil (deleteStudent akışını simüle et) ──
    console.log('\n📋 Test 4: Hesap silme (deleteStudent akışı)');
    await db.collection('deletedEmails').doc(emailHash).set({
      email: TEST_EMAIL,
      deletedAt: Date.now(),
    });
    await db.collection('users').doc(testUid).delete();
    await auth.deleteUser(testUid);

    const deletedUserSnap = await db.collection('users').doc(testUid).get();
    assert(!deletedUserSnap.exists, 'Firestore user kaydı silindi');

    let authDeleted = false;
    try {
      await auth.getUser(testUid);
    } catch (e) {
      authDeleted = e.code === 'auth/user-not-found';
    }
    assert(authDeleted, 'Firebase Auth kullanıcısı silindi');

    // ── TEST 5: deletedEmails kaydı var mı? ──
    console.log('\n📋 Test 5: deletedEmails kaydı doğrulama');
    const afterSnap = await db.collection('deletedEmails').doc(emailHash).get();
    assert(afterSnap.exists, 'E-posta deletedEmails koleksiyonuna kaydedildi');
    assert(afterSnap.data().email === TEST_EMAIL, 'Kaydedilen e-posta doğru');

    // ── TEST 6: check-deleted-email API mantığını simüle et ──
    console.log('\n📋 Test 6: check-deleted-email API mantığı (tekrar kayıt engeli)');
    const checkHash = crypto.createHash('sha256').update(TEST_EMAIL).digest('hex');
    const checkSnap = await db.collection('deletedEmails').doc(checkHash).get();
    assert(checkSnap.exists === true, 'Silinen e-posta tespit edildi → kayıt ENGELLENMELİ');

    // ── TEST 7: Farklı e-posta engellenmemeli ──
    console.log('\n📋 Test 7: Farklı e-posta engellenmemeli');
    const otherHash = crypto.createHash('sha256').update('random-safe@example.com').digest('hex');
    const otherSnap = await db.collection('deletedEmails').doc(otherHash).get();
    assert(!otherSnap.exists, 'Farklı e-posta engellenmiyor → kayıt SERBEST');

    // ── TEST 8: Auth aynı e-posta ile yeni kullanıcı oluşturulabilir mi? ──
    console.log('\n📋 Test 8: Firebase Auth aynı e-posta ile yeni kullanıcı (Auth seviyesi)');
    const newUser = await auth.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    assert(!!newUser.uid, `Auth yeni kullanıcı oluşturabilir (uid: ${newUser.uid}) — ama uygulama katmanında engellenecek`);
    testUid = newUser.uid;

  } catch (err) {
    console.error('\n💥 Test hatası:', err.message);
    failed++;
  } finally {
    await cleanup();
  }

  console.log('\n═══════════════════════════════════════════');
  console.log(`  Sonuç: ${passed} geçti, ${failed} başarısız`);
  console.log('═══════════════════════════════════════════');
  process.exit(failed > 0 ? 1 : 0);
}

run();
