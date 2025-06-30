# Panduan Hot Reload untuk Pengembangan

## Pengenalan

Panduan ini menjelaskan cara menggunakan fitur hot reload yang telah diimplementasikan untuk mempercepat proses pengembangan aplikasi. Hot reload memungkinkan perubahan kode langsung terlihat tanpa perlu me-restart server atau me-refresh browser secara manual.

## Fitur yang Diimplementasikan

1. **Hot Reload untuk Server (Backend)**
   - Menggunakan `nodemon` untuk memantau perubahan file di direktori `server`
   - Server akan otomatis di-restart ketika ada perubahan pada file TypeScript atau JavaScript

2. **Hot Module Replacement (HMR) untuk Client (Frontend)**
   - Menggunakan fitur HMR bawaan dari Vite
   - Perubahan pada komponen React akan langsung terlihat tanpa kehilangan state

## Cara Menggunakan

### Menjalankan Development dengan Hot Reload

Untuk menjalankan aplikasi dengan hot reload, gunakan perintah:

```bash
npm run dev:full
```

Perintah ini akan menjalankan:
- Server backend dengan nodemon (auto-restart) di port 8080
- Client frontend dengan Vite (HMR) di port 5176 (atau port lain jika 5176 sudah digunakan)

### Menjalankan Hanya Server dengan Hot Reload

```bash
npm run dev:hot
```

### Menjalankan Hanya Client dengan Hot Reload

```bash
npm run client:dev
```

## Cara Kerja

### Server Hot Reload

Konfigurasi nodemon (di `nodemon.json`) diatur untuk:
- Memantau perubahan di direktori `server` dan `shared`
- Memantau file dengan ekstensi `.ts`, `.js`, dan `.json`
- Mengabaikan direktori `node_modules`, `dist`, dan `client`
- Menjalankan ulang server dengan delay 500ms setelah perubahan terdeteksi

### Client Hot Module Replacement

Vite dikonfigurasi dengan:
- HMR yang diaktifkan dengan overlay error untuk debugging
- Polling file untuk kompatibilitas yang lebih baik di berbagai sistem
- Proxy API untuk mengarahkan permintaan `/api` ke server backend

## Troubleshooting

### Port Sudah Digunakan

Jika Anda melihat error "Port XXXX is in use", Vite akan otomatis mencoba port berikutnya yang tersedia.

### Server Tidak Me-restart

Jika server tidak me-restart setelah perubahan:
1. Pastikan perubahan disimpan
2. Coba ketik `rs` di terminal tempat nodemon berjalan untuk me-restart secara manual
3. Periksa `nodemon.json` untuk memastikan direktori yang benar sedang dipantau

### Client Tidak Me-refresh

Jika perubahan pada client tidak terlihat:
1. Pastikan perubahan disimpan
2. Periksa konsol browser untuk error
3. Coba refresh browser secara manual
4. Pastikan HMR diaktifkan di konfigurasi Vite