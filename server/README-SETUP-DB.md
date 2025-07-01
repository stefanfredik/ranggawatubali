# Panduan Setup Database

Dokumen ini menjelaskan cara melakukan setup database untuk aplikasi Rangga Watu Bali.

## Prasyarat

Sebelum melakukan setup database, pastikan:

1. File `.env` sudah dikonfigurasi dengan benar, terutama `DATABASE_URL`
2. Node.js dan npm sudah terinstal
3. Semua dependensi sudah diinstal dengan menjalankan `npm install`

## Opsi Setup Database

Ada beberapa cara untuk melakukan setup database:

### 1. Setup Dasar (Hanya Membuat Tabel)

Jalankan perintah berikut untuk membuat tabel-tabel yang diperlukan:

```bash
npm run db:setup
```

Script ini akan membuat tabel-tabel berikut:
- `session`: untuk menyimpan data sesi pengguna
- `donations`: untuk menyimpan data donasi

### 2. Setup Lengkap (Rekomendasi)

Jalankan perintah berikut untuk setup database secara lengkap:

```bash
npm run db:setup:all
```

Script ini akan:
1. Menjalankan semua file migrasi untuk membuat tabel-tabel yang diperlukan
2. Memverifikasi bahwa semua tabel telah dibuat dengan benar
3. Membuat tabel secara manual jika ada yang gagal dibuat
4. Menjalankan script seed untuk menambahkan data awal (jika ada)

## Rollback Database

Jika Anda perlu menghapus tabel-tabel yang sudah dibuat:

```bash
npm run db:rollback
```

Untuk menghapus tabel tertentu saja:

```bash
npm run db:rollback:session    # Menghapus tabel session
npm run db:rollback:donations  # Menghapus tabel donations
```

## Troubleshooting

### Error "relation does not exist"

Jika Anda mendapatkan error "relation does not exist" saat login atau menggunakan aplikasi, jalankan:

```bash
npm run db:setup:all
```

Atau jalankan script secara langsung:

```bash
node server/setup-all.cjs
```

### Error Koneksi Database

Pastikan:
1. `DATABASE_URL` di file `.env` sudah benar
2. Database server sudah berjalan
3. Firewall tidak memblokir koneksi ke database

### Error Lainnya

Jika mengalami error lain, coba:
1. Jalankan `npm run db:rollback` untuk menghapus semua tabel
2. Jalankan `npm run db:setup:all` untuk membuat ulang semua tabel