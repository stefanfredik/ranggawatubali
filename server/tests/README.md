# Unit Testing untuk Backend Ranggawatubali

Dokumentasi ini menjelaskan cara menjalankan dan mengembangkan unit test untuk backend aplikasi Ranggawatubali.

## Struktur Test

Unit test diorganisir dalam direktori `server/tests` dengan struktur sebagai berikut:

```
server/tests/
├── README.md           # Dokumentasi unit testing
├── setup.ts            # Konfigurasi global untuk testing
├── auth.test.ts        # Test untuk autentikasi
├── members.test.ts     # Test untuk manajemen anggota
├── announcements.test.ts # Test untuk pengumuman
├── activities.test.ts  # Test untuk aktivitas
├── payments.test.ts    # Test untuk pembayaran
├── wallets.test.ts     # Test untuk dompet
├── transactions.test.ts # Test untuk transaksi
├── dues.test.ts        # Test untuk iuran
└── initialFees.test.ts # Test untuk biaya awal
```

## Teknologi yang Digunakan

- **Jest**: Framework testing JavaScript
- **Supertest**: Library untuk testing HTTP
- **Mock Service Worker (MSW)**: Untuk mocking API requests

## Menjalankan Test

Untuk menjalankan semua test:

```bash
npm run test
```

Untuk menjalankan test tertentu:

```bash
npm run test -- server/tests/auth.test.ts
```

Untuk menjalankan test dengan coverage report:

```bash
npm run test:coverage
```

## Mocking Database

Test menggunakan database in-memory untuk mengisolasi pengujian dari database produksi. Konfigurasi mock database dapat ditemukan di `server/tests/setup.ts`.

## Praktik Terbaik

1. **Isolasi Test**: Setiap test harus berjalan secara independen tanpa bergantung pada test lain.
2. **Reset Database**: Reset database sebelum setiap test untuk memastikan konsistensi.
3. **Mock External Services**: Gunakan mock untuk layanan eksternal seperti email atau pembayaran.
4. **Test Positif dan Negatif**: Uji skenario berhasil dan gagal untuk setiap endpoint.
5. **Validasi Response**: Periksa status code, format response, dan data yang dikembalikan.

## Contoh Test

Lihat file `auth.test.ts` untuk contoh cara menulis test untuk endpoint autentikasi.