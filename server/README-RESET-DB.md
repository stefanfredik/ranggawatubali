# Reset Database Script

Script ini digunakan untuk mereset database dan menambahkan data default ke dalam aplikasi Ranggawatubali.

## Fungsi

Script ini akan melakukan:

1. Menghapus semua data dari tabel-tabel berikut (dalam urutan yang memperhatikan foreign key constraints):
   - activityParticipants
   - initialFees
   - dues
   - transactions
   - payments
   - announcements
   - activities
   - wallets
   - users

2. Membuat data default:
   - User admin (admin@example.com / 12345)
   - 3 user anggota (member1@example.com, member2@example.com, member3@example.com / 12345)
   - Dompet utama organisasi
   - Pengumuman contoh
   - Aktivitas contoh
   - Iuran untuk anggota
   - Uang pangkal untuk anggota

## Cara Penggunaan

Untuk menjalankan script reset database, gunakan perintah berikut:

```bash
npm run db:reset
```

Atau jika menggunakan yarn:

```bash
yarn db:reset
```

## Kredensial Default

Setelah menjalankan script, Anda dapat login dengan kredensial berikut:

- **Admin**:
  - Email: admin@example.com
  - Password: 12345

- **Anggota**:
  - Email: member1@example.com
  - Password: 12345

## Peringatan

⚠️ **PERHATIAN**: Script ini akan menghapus SEMUA data yang ada di database. Gunakan dengan hati-hati, terutama di lingkungan produksi.

## Kustomisasi

Jika Anda ingin mengubah data default yang dibuat, Anda dapat mengedit file `server/reset-db.js` dan menyesuaikan nilai-nilai yang diinginkan.