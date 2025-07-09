import 'dotenv/config';
import { db } from "./db.ts";
import { 
  users, 
  announcements, 
  activities, 
  activityParticipants, 
  payments, 
  wallets, 
  transactions, 
  dues, 
  initialFees,
  donations 
} from "../shared/schema.ts";
import { eq, ne } from "drizzle-orm";

async function clearDatabaseKeepAdmin() {
  try {
    console.log('Mulai membersihkan database...');
    
    // Cari user admin yang akan dipertahankan
    const adminUsers = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
    
    if (adminUsers.length === 0) {
      console.error('Tidak ada user admin yang ditemukan!');
      return;
    }
    
    const admin = adminUsers[0];
    console.log(`Mempertahankan user admin: ${admin.fullName} (${admin.email})`);
    
    // Hapus data dari semua tabel dalam urutan yang benar (mempertimbangkan foreign key constraints)
    console.log('Menghapus data dari semua tabel kecuali user admin...');
    
    // Hapus tabel dengan foreign key terlebih dahulu
    await db.delete(activityParticipants);
    await db.delete(initialFees);
    await db.delete(dues);
    await db.delete(transactions);
    await db.delete(payments);
    await db.delete(announcements);
    await db.delete(activities);
    
    // Hapus donasi terlebih dahulu karena memiliki foreign key ke wallets
    try {
      await db.delete(donations);
      console.log('Semua donasi berhasil dihapus.');
    } catch (error) {
      // Jika tabel donasi tidak ada, lewati
      console.log('Tabel donasi tidak ditemukan atau kosong.');
    }
    
    // Hapus wallets setelah donasi dihapus
    await db.delete(wallets);
    console.log('Semua wallet berhasil dihapus.');
    
    // Hapus semua user kecuali admin
    const deletedUsers = await db.delete(users).where(ne(users.id, admin.id)).returning();
    console.log(`${deletedUsers.length} user berhasil dihapus.`);
    
    console.log('Pembersihan database selesai!');
    console.log(`\nUser admin yang dipertahankan: ${admin.fullName} (${admin.email})`);
    
  } catch (error) {
    console.error('Error saat membersihkan database:', error);
  } finally {
    process.exit(0);
  }
}

clearDatabaseKeepAdmin();