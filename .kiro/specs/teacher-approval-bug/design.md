# Teknik Tasarım

## Genel Bakış

Bu düzeltme, öğretmen kayıt akışını değiştirerek başvuruların `users` yerine `pendingTeachers` koleksiyonuna yazılmasını sağlar. Mevcut admin onay/reddetme API'leri zaten `pendingTeachers` koleksiyonuyla çalışacak şekilde tasarlanmış, sadece kayıt tarafı yanlış koleksiyona yazıyor.

## Değişiklik Planı

### 1. `pages/teacher/register.js` — Kayıt Hedefini Değiştir

**Mevcut kod (sorunlu):**
```javascript
await setDoc(doc(db, 'users', user.uid), { ... });
```

**Düzeltilmiş kod:**
```javascript
await setDoc(doc(db, 'pendingTeachers', user.uid), { ... });
```

- Firebase Auth kullanıcısı yine oluşturulacak (login için gerekli)
- Ancak profil verisi `pendingTeachers` koleksiyonuna yazılacak
- `approved: false` ve `status: 'pending'` alanları korunacak

### 2. `pages/teacher/apply.js` — Kayıt Hedefini Değiştir

Aynı değişiklik:
```javascript
await setDoc(doc(db, 'pendingTeachers', user.uid), { ... });
```

### 3. Login/Auth Akışı Kontrolü

Öğretmen giriş yaptığında, `users` koleksiyonunda kaydı yoksa `pendingTeachers`'da olup olmadığı kontrol edilmeli. Eğer pending durumundaysa, `pending-approval` sayfasına yönlendirilmeli.

Bu kontrol muhtemelen `_app.js` veya auth middleware'de yapılıyor. Mevcut akışı kontrol edip gerekirse güncellememiz gerekecek.

### 4. `pages/api/admin/approveTeacher.js` — Mevcut Mantık Yeterli

Bu API zaten doğru çalışıyor:
1. `pendingTeachers`'dan veriyi okur
2. `users` koleksiyonuna yazar
3. `pendingTeachers`'dan siler

Değişiklik gerekmez.

### 5. `pages/api/admin/rejectTeacher.js` — Mevcut Mantık Yeterli

Bu API de zaten doğru çalışıyor:
1. `pendingTeachers`'dan siler
2. Auth kullanıcısını siler

Değişiklik gerekmez.

## Veri Akışı (Düzeltilmiş)

```
Öğretmen Kayıt → pendingTeachers koleksiyonu (status: pending)
                        ↓
              Admin Paneli görüntüler
                        ↓
            ┌───────────┴───────────┐
            ↓                       ↓
    Admin Onaylar              Admin Reddeder
            ↓                       ↓
    users koleksiyonuna      pendingTeachers'dan
    taşınır (approved)       silinir + Auth silinir
```

## Etki Analizi

- `register.js`: 1 satır değişiklik (`users` → `pendingTeachers`)
- `apply.js`: 1 satır değişiklik (`users` → `pendingTeachers`)
- Auth/login akışı: pending öğretmenlerin doğru yönlendirilmesi için kontrol gerekebilir
- Admin API'leri: değişiklik gerekmez
- Admin paneli: değişiklik gerekmez (zaten `pendingTeachers`'dan okuyor)
