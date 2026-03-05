# Bugfix Gereksinimleri

## Giriş

Yeni öğretmen başvuruları admin onayı beklemeden otomatik olarak onaylanıyor. Admin panelinde "No pending applications" görünüyor ama öğretmenler zaten "Approved Tutors" listesinde. Admin'in yeni öğretmen başvurusunu manuel olarak onaylaması ya da reddetmesi gerekiyor ama sistem bu adımı atlıyor.

## Bug Tanımı

### Beklenen Davranış
1. Öğretmen kayıt formunu doldurur ve gönderir
2. Başvuru `pendingTeachers` koleksiyonuna yazılır
3. Admin panelinde "Pending Applications" altında görünür
4. Admin başvuruyu onaylar → öğretmen `users` koleksiyonuna `approved: true` ile taşınır
5. Veya admin reddeder → başvuru silinir

### Mevcut (Hatalı) Davranış
1. Öğretmen kayıt formunu doldurur ve gönderir
2. Başvuru doğrudan `users` koleksiyonuna `role: 'teacher'` olarak yazılır
3. `pendingTeachers` koleksiyonuna hiçbir şey yazılmaz
4. Admin paneli `pendingTeachers` koleksiyonunu okuduğu için her zaman "No pending applications" gösterir
5. Öğretmen `approved: false` ve `status: 'pending'` ile kaydedilse de, `users` koleksiyonunda `role: 'teacher'` olarak zaten mevcut

## Kök Neden Analizi

### Etkilenen Dosyalar
1. `pages/teacher/register.js` (satır ~148): `setDoc(doc(db, 'users', user.uid), {...})` — doğrudan `users` koleksiyonuna yazıyor
2. `pages/teacher/apply.js` (satır ~72): `setDoc(doc(db, 'users', user.uid), {...})` — doğrudan `users` koleksiyonuna yazıyor

### Sorunun Kaynağı
- Her iki kayıt sayfası da Firebase Auth ile kullanıcı oluşturup ardından `users` koleksiyonuna doğrudan yazıyor
- `pendingTeachers` koleksiyonuna hiçbir zaman veri yazılmıyor
- Admin paneli (`pages/admin/teachers.js`) bekleyen başvuruları `pendingTeachers` koleksiyonundan okuyor
- `approveTeacher.js` API'si de `pendingTeachers`'dan okuyup `users`'a taşıma mantığıyla çalışıyor
- Sonuç: kayıt ile onay akışı arasında kopukluk var

### Bug Koşulu C(X)
Bir öğretmen kayıt formu gönderildiğinde, eğer veri `pendingTeachers` koleksiyonu yerine doğrudan `users` koleksiyonuna yazılıyorsa, admin onay akışı atlanmış olur.

## Doğruluk Özellikleri (Correctness Properties)

### CP-1: Kayıt Akışı Bütünlüğü
Öğretmen kaydı tamamlandığında, veri YALNIZCA `pendingTeachers` koleksiyonuna yazılmalı, `users` koleksiyonuna yazılmamalıdır.

### CP-2: Admin Onay Geçidi
Bir öğretmenin `users` koleksiyonunda `role: 'teacher'` ile var olabilmesi için, admin tarafından onaylanmış olması gerekir (approveTeacher API'si üzerinden).

### CP-3: Pending Görünürlüğü
`pendingTeachers` koleksiyonuna yazılan her başvuru, admin panelinde "Pending Applications" altında görünmelidir.

### CP-4: Reddetme Temizliği
Reddedilen bir başvuru `pendingTeachers`'dan silinmeli ve `users` koleksiyonuna taşınmamalıdır.

## Kullanıcı Hikayeleri

### US-1: Öğretmen Başvuru Akışı
Bir öğretmen olarak, kayıt formunu gönderdiğimde başvurumun admin onayına sunulmasını istiyorum, böylece platformda yalnızca onaylanmış öğretmenler aktif olur.

**Kabul Kriterleri:**
- Kayıt formu gönderildiğinde veri `pendingTeachers` koleksiyonuna yazılır
- `users` koleksiyonuna doğrudan yazılmaz
- Öğretmene "başvurunuz inceleniyor" mesajı gösterilir

### US-2: Admin Onay Akışı
Bir admin olarak, yeni öğretmen başvurularını görmek, incelemek ve onaylamak/reddetmek istiyorum.

**Kabul Kriterleri:**
- Admin panelinde bekleyen başvurular doğru şekilde listelenir
- Onaylama işlemi öğretmeni `users` koleksiyonuna taşır
- Reddetme işlemi başvuruyu siler
