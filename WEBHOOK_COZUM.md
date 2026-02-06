# 🚀 STRIPE WEBHOOK - KALİCİ ÇÖZÜM

## ❌ SORUN: Stripe CLI Sürekli Açık Olmalı mı?

**Şu anki durum:**
- ✅ `.env`'de `STRIPE_WEBHOOK_SECRET` var
- ❌ Stripe CLI kapalıysa webhook çalışmıyor
- ❌ Booking düşmüyor

**Sebebi:** Development'ta Stripe'ın webhookları `localhost`'a ulaşması için tunnel gerekli.

---

## ✅ ÇÖZÜM 1: ngrok (Önerilen - Kalıcı Tunnel)

### Neden ngrok?
- ✅ Bir kez kur, hep açık kalır
- ✅ Her restart'ta aynı URL (ücretli plan)
- ✅ Stripe CLI'dan daha stabil
- ✅ Production'a geçince aynı webhook kullanılır

### Kurulum

**1. ngrok İndir:**
https://ngrok.com/download

**2. Kayıt Ol:**
https://dashboard.ngrok.com/signup

**3. Auth Token Al:**
```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

**4. Tunnel Başlat:**
```powershell
ngrok http 3000
```

**5. Public URL Kopyala:**
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

**6. Stripe Dashboard'a Ekle:**

https://dashboard.stripe.com/test/webhooks

1. "Add endpoint"
2. URL: `https://abc123.ngrok-free.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`
4. Add endpoint
5. Secret'ı kopyala → `.env`'e ekle

**7. .env Güncelle:**
```env
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok-free.app
```

**8. Server Restart:**
```bash
# Ctrl+C
npm run dev
```

**ARTIK STRIPE CLI AÇMANA GEREK YOK!** ✅

---

## ✅ ÇÖZÜM 2: Production'a Hemen Geç (En Basit)

Eğer bugün zaten production'a çıkacaksan:

### 1. Vercel/Netlify'a Deploy Et

```bash
# Vercel
vercel --prod

# Netlify
netlify deploy --prod
```

### 2. Production URL Al

Örnek: `https://bridgelang.vercel.app`

### 3. Stripe Webhook Kaydet

https://dashboard.stripe.com/webhooks

1. "Add endpoint"
2. URL: `https://bridgelang.vercel.app/api/webhooks/stripe`
3. Events: `checkout.session.completed`
4. Add endpoint
5. Secret kopyala

### 4. Production .env Ekle

```bash
# Vercel
vercel env add STRIPE_WEBHOOK_SECRET
# Secret'ı yapıştır
# Production seç

# .env dosyasında şu satırı değiştir:
# STRIPE_WEBHOOK_SECRET=whsec_29b09... # test key
STRIPE_WEBHOOK_SECRET=whsec_PRODUCTION_SECRET # production key
```

### 5. Test Et

Production sitede booking yap → Düşmeli ✅

---

## ✅ ÇÖZÜM 3: Her Seferinde Stripe CLI (Şimdiki Hali)

Eğer development'ta çalışmaya devam edeceksen:

**Terminal 1:**
```powershell
npm run dev
```

**Terminal 2:**
```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**2 terminal yan yana açık olmalı.** Stripe CLI kapatınca webhook çalışmaz.

---

## 📊 Karşılaştırma

| Çözüm | Avantaj | Dezavantaj | Önerilen |
|-------|---------|------------|----------|
| **Stripe CLI** | Kolay, resmi | Her seferinde açman lazım | ❌ |
| **ngrok** | Kalıcı, stabil | Küçük setup gerekir | ✅ |
| **Production** | Gerçek, canlı | Development için uygun değil | ⚠️ |

---

## 🎯 BENİM ÖNER

**Şimdi yapacakların (bugün production'a geçeceksen):**

1. ✅ **Production'a deploy et** (Vercel/Netlify)
2. ✅ **Stripe webhook'u production URL'e kaydet**
3. ✅ **Production secret'ı .env'e ekle**
4. ✅ **Test et - ARTIK STRIPE CLI AÇMANA GEREK YOK!**

**Development'ta devam edeceksen:**

1. ✅ **ngrok kur** (10 dakika)
2. ✅ **ngrok tunnel başlat** (bir kez, sonra açık kalır)
3. ✅ **Stripe webhook'u ngrok URL'e kaydet**
4. ✅ **ARTIK STRIPE CLI AÇMANA GEREK YOK!**

---

## ⚠️ ÖNEMLİ NOT

`.env` dosyanda şu an **TEST key** var:
```env
STRIPE_WEBHOOK_SECRET=whsec_29b09c5904048f9304aea45b966245d15003f04220a1bfaa0c141b12cac29c72 # test key
```

Bu secret **Stripe CLI** için. Production'da **farklı bir secret** kullanman lazım (Stripe Dashboard'dan).

---

## 🚀 HIZLI BAŞLANGIÇ

### Şimdi Ne Yapmalısın?

**Seçenek A: Bugün production'a çık** (önerilen)
```bash
vercel --prod
# Webhook'u kaydet
# Test et
# Bitir ✅
```

**Seçenek B: ngrok kur** (development için)
```bash
# ngrok indir
ngrok http 3000
# Webhook kaydet
# Development'ta artık Stripe CLI gerekmez ✅
```

**Seçenek C: Stripe CLI kullanmaya devam et** (şimdiki gibi)
```bash
# Her seferinde
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Kapatma, yoksa webhook çalışmaz
```

Hangisini yapmak istersin?
