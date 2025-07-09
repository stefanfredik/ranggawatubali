# Panduan Membersihkan Database

Dokumen ini berisi panduan untuk membersihkan database aplikasi Rangga Watu Bali.

## Membersihkan Database dengan Mempertahankan User Admin

Jika Anda ingin mengosongkan database tetapi tetap mempertahankan satu user admin, Anda dapat menggunakan script `clear-db-keep-admin.js`.

### Cara Penggunaan

1. Pastikan aplikasi tidak sedang berjalan
2. Buka terminal atau command prompt
3. Arahkan ke direktori utama aplikasi
4. Jalankan perintah berikut:

```bash
node server/clear-db-keep-admin.js
```

Atau jika Anda menggunakan npm script:

```bash
npx tsx server/clear-db-keep-admin.js
```

### Apa yang Dilakukan Script Ini?

Script ini akan:

1. Mencari user dengan role 'admin' di database
2. Menghapus semua data dari tabel-tabel berikut:
   - activityParticipants
   - initialFees
   - dues
   - transactions
   - payments
   - announcements
   - activities
   - wallets
   - donations (jika ada)
   - users (kecuali user admin yang ditemukan)

### Catatan Penting

- Script ini hanya akan mempertahankan satu user admin (yang pertama ditemukan)
- Pastikan Anda memiliki backup database sebelum menjalankan script ini
- Setelah menjalankan script, database akan kosong kecuali satu user admin

## Reset Database Lengkap

Jika Anda ingin melakukan reset database lengkap (termasuk menghapus semua user dan membuat data contoh baru), gunakan script `reset-db.js` yang sudah ada:

```bash
node server/reset-db.js
```

Atau dengan npx:

```bash
npx tsx server/reset-db.js
```