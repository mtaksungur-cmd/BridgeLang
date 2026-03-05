# Uygulama Görevleri

## Görevler

- [x] 1. `register.js` dosyasında kayıt hedefini `pendingTeachers` olarak değiştir
  - [x] 1.1 `pages/teacher/register.js` dosyasında `setDoc(doc(db, 'users', user.uid), {...})` satırını `setDoc(doc(db, 'pendingTeachers', user.uid), {...})` olarak değiştir
  - [x] 1.2 Kayıt sonrası `signOut(auth)` çağrısının korunduğunu doğrula (kullanıcı pending durumda olduğu için oturum açık kalmamalı)
- [x] 2. `apply.js` dosyasında kayıt hedefini `pendingTeachers` olarak değiştir
  - [x] 2.1 `pages/teacher/apply.js` dosyasında `setDoc(doc(db, 'users', user.uid), {...})` satırını `setDoc(doc(db, 'pendingTeachers', user.uid), {...})` olarak değiştir
- [x] 3. Login akışında pending öğretmen kontrolü ekle
  - [x] 3.1 `pages/login.js` dosyasında, `users` koleksiyonunda kullanıcı bulunamadığında `pendingTeachers` koleksiyonunu kontrol et
  - [x] 3.2 Eğer kullanıcı `pendingTeachers`'da bulunursa, `signOut` yap ve `/teacher/pending-approval` sayfasına yönlendir
  - [x] 3.3 `useEffect` içindeki auth kontrolünde de aynı pending kontrolünü ekle
- [x] 4. NavbarSwitcher'da pending öğretmen durumunu yönet
  - [x] 4.1 `components/NavbarSwitcher.js` dosyasında, `users` koleksiyonunda kullanıcı bulunamadığında `pendingTeachers` koleksiyonunu kontrol et
  - [x] 4.2 Pending öğretmen için `DefaultNavbar` göster (mevcut davranış zaten bu, sadece hata loglamasını önle)
