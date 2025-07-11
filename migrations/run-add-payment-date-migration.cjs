// Migration untuk menambahkan kolom payment_date ke tabel donation_contributors
const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  // Buat koneksi ke database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Cek apakah kolom payment_date sudah ada di tabel donation_contributors
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'donation_contributors' AND column_name = 'payment_date';
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    // Jika kolom belum ada, tambahkan kolom baru
    if (rows.length === 0) {
      console.log('Menambahkan kolom payment_date ke tabel donation_contributors...');
      
      // Tambahkan kolom payment_date
      const addColumnQuery = `
        ALTER TABLE donation_contributors 
        ADD COLUMN payment_date DATE;
      `;
      
      await pool.query(addColumnQuery);
      console.log('Kolom payment_date berhasil ditambahkan!');
    } else {
      console.log('Kolom payment_date sudah ada di tabel donation_contributors.');
    }
    
    console.log('Migrasi selesai!');
  } catch (error) {
    console.error('Error saat menjalankan migrasi:', error);
    throw error;
  } finally {
    // Tutup koneksi pool
    await pool.end();
  }
}

// Jalankan migrasi
main().catch(err => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});