import 'dotenv/config';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
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
  initialFees 
} from "../shared/schema.ts";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function resetDatabase() {
  try {
    console.log('Mulai reset database...');
    
    // Hapus data dari semua tabel dalam urutan yang benar (mempertimbangkan foreign key constraints)
    console.log('Menghapus data dari semua tabel...');
    
    // Hapus tabel dengan foreign key terlebih dahulu
    await db.delete(activityParticipants);
    await db.delete(initialFees);
    await db.delete(dues);
    await db.delete(transactions);
    await db.delete(payments);
    await db.delete(announcements);
    await db.delete(activities);
    await db.delete(wallets);
    await db.delete(users);
    
    console.log('Semua data berhasil dihapus.');
    
    // Buat user admin
    console.log('Membuat user admin...');
    const adminPassword = await hashPassword("12345");
    
    const [admin] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@example.com',
      password: adminPassword,
      fullName: 'Administrator',
      role: 'admin',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    }).returning();
    
    console.log('User admin berhasil dibuat:', {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      role: admin.role
    });
    
    // Buat beberapa user contoh
    console.log('Membuat user contoh...');
    const memberPassword = await hashPassword("12345");
    
    const memberData = [
      {
        username: 'member1',
        email: 'member1@example.com',
        password: memberPassword,
        fullName: 'Anggota Satu',
        phone: '081234567890',
        role: 'member',
        status: 'active',
        joinDate: '2023-01-15',
        birthday: '1990-05-20'
      },
      {
        username: 'member2',
        email: 'member2@example.com',
        password: memberPassword,
        fullName: 'Anggota Dua',
        phone: '081234567891',
        role: 'member',
        status: 'active',
        joinDate: '2023-02-10',
        birthday: '1992-08-15'
      },
      {
        username: 'member3',
        email: 'member3@example.com',
        password: memberPassword,
        fullName: 'Anggota Tiga',
        phone: '081234567892',
        role: 'member',
        status: 'active',
        joinDate: '2023-03-05',
        birthday: '1988-11-30'
      }
    ];
    
    const createdMembers = await db.insert(users).values(memberData).returning();
    
    console.log(`${createdMembers.length} user contoh berhasil dibuat.`);
    
    // Buat dompet default
    console.log('Membuat dompet default...');
    const [mainWallet] = await db.insert(wallets).values({
      name: 'Kas Utama',
      balance: '5000000',
      description: 'Dompet utama organisasi',
      createdBy: admin.id
    }).returning();
    
    console.log('Dompet default berhasil dibuat:', {
      id: mainWallet.id,
      name: mainWallet.name,
      balance: mainWallet.balance
    });
    
    // Buat pengumuman contoh
    console.log('Membuat pengumuman contoh...');
    const announcementData = [
      {
        title: 'Selamat Datang di Rangga Watu Bali',
        content: 'Selamat datang di sistem manajemen organisasi Rangga Watu Bali. Sistem ini akan membantu kita mengelola kegiatan, keuangan, dan komunikasi organisasi dengan lebih efektif.',
        type: 'general',
        authorId: admin.id
      },
      {
        title: 'Rapat Anggota Tahunan',
        content: 'Rapat Anggota Tahunan akan dilaksanakan pada tanggal 15 Juli 2023 pukul 10.00 WITA di Balai Banjar. Mohon kehadiran seluruh anggota.',
        type: 'important',
        authorId: admin.id
      }
    ];
    
    const createdAnnouncements = await db.insert(announcements).values(announcementData).returning();
    
    console.log(`${createdAnnouncements.length} pengumuman contoh berhasil dibuat.`);
    
    // Buat aktivitas contoh
    console.log('Membuat aktivitas contoh...');
    const activityData = [
      {
        title: 'Gotong Royong Membersihkan Pura',
        description: 'Kegiatan gotong royong membersihkan area pura dalam rangka persiapan upacara.',
        date: '2023-08-20',
        location: 'Pura Desa',
        maxParticipants: 30,
        status: 'upcoming',
        createdBy: admin.id
      },
      {
        title: 'Latihan Tari Tradisional',
        description: 'Latihan rutin tari tradisional Bali untuk persiapan festival budaya.',
        date: '2023-07-25',
        location: 'Balai Banjar',
        maxParticipants: 15,
        status: 'upcoming',
        createdBy: admin.id
      }
    ];
    
    const createdActivities = await db.insert(activities).values(activityData).returning();
    
    console.log(`${createdActivities.length} aktivitas contoh berhasil dibuat.`);
    
    // Buat iuran untuk anggota
    console.log('Membuat iuran untuk anggota...');
    const duesData = [];
    
    for (const member of createdMembers) {
      duesData.push({
        userId: member.id,
        amount: '50000',
        dueDate: '2023-07-30',
        period: '2023-07',
        status: 'unpaid',
        walletId: mainWallet.id
      });
    }
    
    const createdDues = await db.insert(dues).values(duesData).returning();
    
    console.log(`${createdDues.length} iuran contoh berhasil dibuat.`);
    
    // Buat uang pangkal untuk anggota
    console.log('Membuat uang pangkal untuk anggota...');
    const initialFeesData = [];
    
    for (const member of createdMembers) {
      initialFeesData.push({
        userId: member.id,
        amount: '250000',
        status: 'unpaid',
        walletId: mainWallet.id
      });
    }
    
    const createdInitialFees = await db.insert(initialFees).values(initialFeesData).returning();
    
    console.log(`${createdInitialFees.length} uang pangkal contoh berhasil dibuat.`);
    
    console.log('Reset database selesai!');
    console.log('\nCredential untuk login:');
    console.log('Admin: admin@example.com / 12345');
    console.log('Member: member1@example.com / 12345');
    
  } catch (error) {
    console.error('Error saat reset database:', error);
  } finally {
    process.exit(0);
  }
}

resetDatabase();