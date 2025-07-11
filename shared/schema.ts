import { pgTable, text, serial, integer, boolean, timestamp, date, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  nickname: text("nickname"), // Nama panggilan
  phone: text("phone"),
  role: text("role").notNull().default("member"), // "admin", "member", "ketua", "bendahara", "sekretaris"
  status: text("status").notNull().default("active"), // "active", "inactive", "pending"
  joinDate: date("join_date").notNull(),
  birthday: date("birthday"),
  occupation: text("occupation"), // "Mahasiswa", "Bekerja", "Bekerja Sambil Kuliah"
  campus: text("campus"), // Kampus (bagi yang sedang kuliah)
  residence: text("residence"), // Tempat Tinggal: Alamat
  arrivalDate: text("arrival_date"), // Tiba Di Bali: Bulan dan Tahun
  position: text("position"), // Fungsi atau Jabatan: Ketua, Wakil Ketua, Bendahara, Sekretaris, Suka Duka, Kerohanian, Konsumsi
  profile_picture: text("profile_picture"), // URL atau path ke foto profil
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("general"), // "general", "important", "event", "system"
  authorId: integer("author_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  location: text("location"),
  maxParticipants: integer("max_participants"),
  status: text("status").notNull().default("upcoming"), // "upcoming", "active", "completed", "cancelled"
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityParticipants = pgTable("activity_participants", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => activities.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in rupiah
  period: text("period").notNull(), // "YYYY-MM" format
  proofImageUrl: text("proof_image_url"),
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected"
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: integer("reviewed_by").references(() => users.id),
  notes: text("notes"),
});

// Tabel untuk dompet keuangan
export const wallets = pgTable("wallets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  balance: decimal("balance", { precision: 15, scale: 2 }).notNull().default("0"),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabel untuk transaksi keuangan
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  walletId: integer("wallet_id").references(() => wallets.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // "income" atau "expense"
  category: text("category").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabel untuk iuran
export const dues = pgTable("dues", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  period: text("period").notNull(), // "YYYY-MM" format
  status: text("status").notNull().default("unpaid"), // "unpaid", "paid"
  paymentDate: date("payment_date"),
  paymentMethod: text("payment_method"),
  walletId: integer("wallet_id").references(() => wallets.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabel untuk uang pangkal
export const initialFees = pgTable("initial_fees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"), // "unpaid", "paid"
  paymentDate: date("payment_date"),
  paymentMethod: text("payment_method"),
  walletId: integer("wallet_id").references(() => wallets.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  announcements: many(announcements),
  activities: many(activities),
  activityParticipants: many(activityParticipants),
  payments: many(payments),
  wallets: many(wallets),
  transactions: many(transactions),
  dues: many(dues),
  initialFees: many(initialFees),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  creator: one(users, {
    fields: [activities.createdBy],
    references: [users.id],
  }),
  participants: many(activityParticipants),
}));

export const activityParticipantsRelations = relations(activityParticipants, ({ one }) => ({
  activity: one(activities, {
    fields: [activityParticipants.activityId],
    references: [activities.id],
  }),
  user: one(users, {
    fields: [activityParticipants.userId],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [payments.reviewedBy],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  creator: one(users, {
    fields: [wallets.createdBy],
    references: [users.id],
  }),
  transactions: many(transactions),
  dues: many(dues),
  initialFees: many(initialFees),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
  creator: one(users, {
    fields: [transactions.createdBy],
    references: [users.id],
  }),
}));

export const duesRelations = relations(dues, ({ one }) => ({
  user: one(users, {
    fields: [dues.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [dues.walletId],
    references: [wallets.id],
  }),
}));

export const initialFeesRelations = relations(initialFees, ({ one }) => ({
  user: one(users, {
    fields: [initialFees.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [initialFees.walletId],
    references: [wallets.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  password: z.string().min(5, "Kata sandi minimal 5 karakter"),
  email: z.string().email("Alamat email tidak valid"),
  username: z.string().min(3, "Nama pengguna minimal 3 karakter"),
  fullName: z.string().min(3, "Nama lengkap minimal 3 karakter"),
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  balance: true,
}).extend({
  balance: z.string().or(z.number()).optional(),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export const insertDuesSchema = createInsertSchema(dues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInitialFeeSchema = createInsertSchema(initialFees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
  createdBy: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  userId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ActivityParticipant = typeof activityParticipants.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Dues = typeof dues.$inferSelect;
export type InsertDues = z.infer<typeof insertDuesSchema>;
export type InitialFee = typeof initialFees.$inferSelect;
export type InsertInitialFee = z.infer<typeof insertInitialFeeSchema>;

// Tabel untuk donasi
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "happy", "sad", "fundraising"
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  targetAmount: decimal("target_amount", { precision: 15, scale: 2 }),
  status: text("status").notNull().default("active"), // "active", "completed", "cancelled"
  walletId: integer("wallet_id").references(() => wallets.id),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabel untuk kontributor donasi
export const donationContributors = pgTable("donation_contributors", {
  id: serial("id").primaryKey(),
  donationId: integer("donation_id").references(() => donations.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  walletId: integer("wallet_id").references(() => wallets.id),
  paymentMethod: text("payment_method").default("cash"), // "cash" atau "transfer"
  paymentDate: date("payment_date"), // Tanggal pembayaran kontribusi
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relasi untuk donasi
export const donationsRelations = relations(donations, ({ one, many }) => ({
  creator: one(users, {
    fields: [donations.createdBy],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [donations.walletId],
    references: [wallets.id],
  }),
  contributors: many(donationContributors),
}));

// Relasi untuk kontributor donasi
export const donationContributorsRelations = relations(donationContributors, ({ one }) => ({
  donation: one(donations, {
    fields: [donationContributors.donationId],
    references: [donations.id],
  }),
  user: one(users, {
    fields: [donationContributors.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [donationContributors.walletId],
    references: [wallets.id],
  }),
}));

// Schema untuk validasi input donasi
export const insertDonationSchema = createInsertSchema(donations, {
  type: z.enum(["happy", "sad", "fundraising"]),
  status: z.enum(["active", "completed", "cancelled"]).default("active"),
  amount: z.coerce.number().min(0),
  targetAmount: z.coerce.number().min(0).optional(),
  walletId: z.number().optional(), // ID dompet untuk menyimpan donasi
  createdBy: z.number().optional(), // Ditambahkan sebagai opsional karena akan diisi dari req.user.id
});

// Schema untuk validasi input kontributor donasi
export const insertDonationContributorSchema = createInsertSchema(donationContributors, {
  amount: z.coerce.number().min(1, {
    message: "Jumlah donasi harus lebih dari 0"
  }),
  userId: z.number().optional(), // Ditambahkan sebagai opsional karena akan diisi dari req.user.id
  donationId: z.number().optional(), // Ditambahkan sebagai opsional karena akan diisi dari parameter URL
  name: z.string().min(3, {
    message: "Nama harus minimal 3 karakter"
  }).optional(), // Ditambahkan sebagai opsional karena akan diisi dari req.user.fullName
  walletId: z.number().optional(), // ID dompet untuk menyimpan donasi
  paymentMethod: z.enum(["cash", "transfer"], {
    errorMap: (issue, ctx) => ({ message: "Metode pembayaran harus cash atau transfer" })
  }).default("cash"),
  paymentDate: z.date().optional(), // Tanggal pembayaran kontribusi
});

// Extend schema untuk form kontributor dengan field tambahan
export const contributorFormSchema = insertDonationContributorSchema.extend({
  contributorType: z.enum(['self', 'member'], {
    errorMap: (issue, ctx) => ({ message: "Tipe kontributor harus self atau member" })
  }),
  memberId: z.string().optional().superRefine((val, ctx) => {
    // Validasi tambahan: jika contributorType adalah 'member', memberId harus diisi
    if (ctx.parent.contributorType === 'member' && (!val || val === '')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Silakan pilih anggota",
        path: ["memberId"]
      });
    }
  }),
});

// Tipe untuk donasi
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

// Tipe untuk kontributor donasi
export type DonationContributor = typeof donationContributors.$inferSelect;
export type InsertDonationContributor = z.infer<typeof insertDonationContributorSchema>;
