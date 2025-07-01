# Database Rollback Guide

Dokumen ini menjelaskan cara melakukan rollback (pengembalian) database ke keadaan sebelumnya dengan menghapus tabel-tabel yang telah dibuat.

## Perintah Rollback

Berikut adalah perintah-perintah yang tersedia untuk melakukan rollback database:

### Rollback Semua Tabel

Untuk melakukan rollback semua tabel database sekaligus:

```bash
npm run db:rollback
```

Perintah ini akan menjalankan script `rollback-all.cjs` yang akan menghapus semua tabel dalam urutan yang benar (tabel dengan dependensi dihapus terlebih dahulu).

### Rollback Tabel Tertentu

Untuk melakukan rollback tabel tertentu saja:

1. Rollback tabel donations:

```bash
npm run db:rollback:donations
```

2. Rollback tabel session:

```bash
npm run db:rollback:session
```

## Catatan Penting

- Pastikan Anda telah mencadangkan data penting sebelum melakukan rollback.
- Rollback akan menghapus semua data dalam tabel yang di-rollback.
- Urutan rollback penting untuk menjaga integritas referensial database.
- Pastikan variabel lingkungan `DATABASE_URL` telah diatur dengan benar sebelum menjalankan perintah rollback.

## Menambahkan Rollback untuk Tabel Baru

Jika Anda menambahkan tabel baru ke database, ikuti langkah-langkah berikut untuk membuat script rollback:

1. Buat file SQL rollback (misalnya `rollback_new_table.sql`) dengan perintah DROP TABLE.
2. Buat file JavaScript rollback (misalnya `rollback-new-table.cjs`) yang mengeksekusi file SQL.
3. Perbarui file `rollback-all.cjs` untuk menyertakan tabel baru dalam urutan rollback.
4. Tambahkan script baru ke `package.json` untuk memudahkan eksekusi.