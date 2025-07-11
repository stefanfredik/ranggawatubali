// @ts-check

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  // Menambahkan kolom payment_date ke tabel donation_contributors
  pgm.addColumn('donation_contributors', {
    payment_date: {
      type: 'date',
      comment: 'Tanggal pembayaran kontribusi',
    },
  });
};

/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.down = (pgm) => {
  // Menghapus kolom payment_date dari tabel donation_contributors
  pgm.dropColumn('donation_contributors', 'payment_date');
};