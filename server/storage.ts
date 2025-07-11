import { users, announcements, activities, payments, activityParticipants, wallets, transactions, dues, initialFees, donations, donationContributors, type User, type InsertUser, type Announcement, type InsertAnnouncement, type Activity, type InsertActivity, type Payment, type InsertPayment, type Wallet, type InsertWallet, type Transaction, type InsertTransaction, type Dues, type InsertDues, type InitialFee, type InsertInitialFee, type Donation, type InsertDonation, type DonationContributor, type InsertDonationContributor } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, count, or } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllMembers(): Promise<User[]>;

  // Announcement methods
  getAnnouncements(): Promise<(Announcement & { author: User })[]>;
  createAnnouncement(announcement: InsertAnnouncement & { authorId: number }): Promise<Announcement>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: number): Promise<boolean>;

  // Activity methods
  getActivities(): Promise<(Activity & { creator: User; participantCount: number })[]>;
  getActivity(id: number): Promise<Activity | undefined>;
  createActivity(activity: InsertActivity & { createdBy: number }): Promise<Activity>;
  updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  joinActivity(activityId: number, userId: number): Promise<boolean>;
  leaveActivity(activityId: number, userId: number): Promise<boolean>;

  // Payment methods
  getPayments(): Promise<(Payment & { user: User })[]>;
  getUserPayments(userId: number): Promise<Payment[]>;
  createPayment(payment: InsertPayment & { userId: number }): Promise<Payment>;
  updatePaymentStatus(id: number, status: string, reviewedBy: number, notes?: string): Promise<Payment | undefined>;

  // Wallet methods
  getWallets(): Promise<(Wallet & { creator: User })[]>;
  getWallet(id: number): Promise<Wallet | undefined>;
  createWallet(wallet: InsertWallet & { createdBy: number }): Promise<Wallet>;
  updateWallet(id: number, updates: Partial<Wallet>): Promise<Wallet | undefined>;
  deleteWallet(id: number): Promise<boolean>;
  updateWalletBalance(id: number, amount: number): Promise<Wallet | undefined>;

  // Transaction methods
  getTransactions(): Promise<(Transaction & { wallet: Wallet; creator: User })[]>;
  getWalletTransactions(walletId: number): Promise<(Transaction & { creator: User })[]>;
  createTransaction(transaction: InsertTransaction & { createdBy: number }): Promise<Transaction>;
  deleteTransaction(id: number): Promise<boolean>;

  // Dues methods
  getDues(): Promise<(Dues & { user: User })[]>;
  getUserDues(userId: number): Promise<(Dues & { user: User })[]>;
  createDues(dues: InsertDues): Promise<Dues>;
  updateDuesStatus(id: number, status: string, paymentDate?: Date, paymentMethod?: string, walletId?: number): Promise<Dues | undefined>;

  // Initial Fee methods
  getInitialFees(): Promise<(InitialFee & { user: User })[]>;
  getUserInitialFee(userId: number): Promise<InitialFee | undefined>;
  createInitialFee(initialFee: InsertInitialFee): Promise<InitialFee>;
  updateInitialFeeStatus(id: number, status: string, paymentDate?: Date, paymentMethod?: string, walletId?: number): Promise<InitialFee | undefined>;

  // Donation methods
  getDonations(): Promise<(Donation & { creator: User })[]>;
  getDonation(id: number): Promise<(Donation & { creator: User }) | undefined>;
  getDonationsByType(type: string): Promise<(Donation & { creator: User })[]>;
  createDonation(donation: InsertDonation & { createdBy: number }): Promise<Donation>;
  updateDonation(id: number, updates: Partial<Donation>): Promise<Donation | undefined>;
  deleteDonation(id: number): Promise<boolean>;
  updateDonationAmount(id: number, contributionAmount: number): Promise<Donation | undefined>;

  // Donation contributor methods
  getDonationContributors(donationId: number): Promise<(DonationContributor & { user: User })[]>;
  createDonationContributor(contributor: InsertDonationContributor & { donationId: number; userId: number; name: string }): Promise<DonationContributor>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalMembers: number;
    activeActivities: number;
    pendingPayments: number;
    birthdaysThisMonth: number;
    totalBalance: number;
  }>;

  getUpcomingBirthdays(): Promise<User[]>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true,
      pruneSessionInterval: 60 * 15 // Prune expired sessions every 15 minutes
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() } as any)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getAllMembers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAnnouncements(): Promise<(Announcement & { author: User })[]> {
    return await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        type: announcements.type,
        authorId: announcements.authorId,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        author: users,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .orderBy(desc(announcements.createdAt));
  }

  async createAnnouncement(announcement: InsertAnnouncement & { authorId: number }): Promise<Announcement> {
    const [newAnnouncement] = await db
      .insert(announcements)
      .values(announcement)
      .returning();
    return newAnnouncement;
  }

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement | undefined> {
    const [announcement] = await db
      .update(announcements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(announcements.id, id))
      .returning();
    return announcement || undefined;
  }

  async deleteAnnouncement(id: number): Promise<boolean> {
    const result = await db.delete(announcements).where(eq(announcements.id, id));
    return result.rowCount > 0;
  }

  async getActivities(): Promise<(Activity & { creator: User; participantCount: number })[]> {
    const result = await db
      .select({
        id: activities.id,
        title: activities.title,
        description: activities.description,
        date: activities.date,
        location: activities.location,
        maxParticipants: activities.maxParticipants,
        status: activities.status,
        createdBy: activities.createdBy,
        createdAt: activities.createdAt,
        creator: users,
        participantCount: count(activityParticipants.id),
      })
      .from(activities)
      .leftJoin(users, eq(activities.createdBy, users.id))
      .leftJoin(activityParticipants, eq(activities.id, activityParticipants.activityId))
      .groupBy(activities.id, users.id)
      .orderBy(desc(activities.createdAt));

    return result;
  }

  async getActivity(id: number): Promise<Activity | undefined> {
    const [activity] = await db.select().from(activities).where(eq(activities.id, id));
    return activity || undefined;
  }

  async createActivity(activity: InsertActivity & { createdBy: number }): Promise<Activity> {
    const [newActivity] = await db
      .insert(activities)
      .values(activity)
      .returning();
    return newActivity;
  }

  async updateActivity(id: number, updates: Partial<Activity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.rowCount > 0;
  }

  async joinActivity(activityId: number, userId: number): Promise<boolean> {
    try {
      await db.insert(activityParticipants).values({ activityId, userId });
      return true;
    } catch {
      return false;
    }
  }

  async leaveActivity(activityId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(activityParticipants)
      .where(and(
        eq(activityParticipants.activityId, activityId),
        eq(activityParticipants.userId, userId)
      ));
    return result.rowCount > 0;
  }

  async getPayments(): Promise<(Payment & { user: User })[]> {
    return await db
      .select({
        id: payments.id,
        userId: payments.userId,
        amount: payments.amount,
        period: payments.period,
        proofImageUrl: payments.proofImageUrl,
        status: payments.status,
        submittedAt: payments.submittedAt,
        reviewedAt: payments.reviewedAt,
        reviewedBy: payments.reviewedBy,
        notes: payments.notes,
        user: users,
      })
      .from(payments)
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.submittedAt));
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.submittedAt));
  }

  async createPayment(payment: InsertPayment & { userId: number }): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async updatePaymentStatus(id: number, status: string, reviewedBy: number, notes?: string): Promise<Payment | undefined> {
    const [payment] = await db
      .update(payments)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
        notes,
      })
      .where(eq(payments.id, id))
      .returning();
    return payment || undefined;
  }

  async getDashboardStats(): Promise<{
    totalMembers: number;
    activeActivities: number;
    pendingPayments: number;
    birthdaysThisMonth: number;
    totalBalance: number;
  }> {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [totalMembersResult] = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(eq(users.status, "active"));

    const [activeActivitiesResult] = await db
      .select({ count: count(activities.id) })
      .from(activities)
      .where(or(eq(activities.status, "upcoming"), eq(activities.status, "active")));

    const [pendingPaymentsResult] = await db
      .select({ count: count(payments.id) })
      .from(payments)
      .where(eq(payments.status, "pending"));

    const [birthdaysResult] = await db
      .select({ count: count(users.id) })
      .from(users)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${users.birthday}) = ${currentMonth}`,
          eq(users.status, "active")
        )
      );

    // Calculate total balance from all wallets
    const walletsResult = await db
      .select({
        totalBalance: sql<number>`SUM(${wallets.balance})`,
      })
      .from(wallets);

    const totalBalance = walletsResult[0]?.totalBalance || 0;

    return {
      totalMembers: totalMembersResult.count,
      activeActivities: activeActivitiesResult.count,
      pendingPayments: pendingPaymentsResult.count,
      birthdaysThisMonth: birthdaysResult.count,
      totalBalance,
    };
  }

  async getUpcomingBirthdays(): Promise<User[]> {
    const currentMonth = new Date().getMonth() + 1;
    
    return await db
      .select()
      .from(users)
      .where(
        and(
          sql`EXTRACT(MONTH FROM ${users.birthday}) = ${currentMonth}`,
          eq(users.status, "active")
        )
      )
      .orderBy(sql`EXTRACT(DAY FROM ${users.birthday})`);
  }

  // Wallet methods
  async getWallets(): Promise<(Wallet & { creator: User })[]> {
    return await db
      .select({
        id: wallets.id,
        name: wallets.name,
        balance: wallets.balance,
        description: wallets.description,
        createdBy: wallets.createdBy,
        createdAt: wallets.createdAt,
        updatedAt: wallets.updatedAt,
        creator: users,
      })
      .from(wallets)
      .leftJoin(users, eq(wallets.createdBy, users.id))
      .orderBy(desc(wallets.createdAt));
  }

  async getWallet(id: number): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.id, id));
    return wallet || undefined;
  }

  async createWallet(wallet: InsertWallet & { createdBy: number }): Promise<Wallet> {
    const [newWallet] = await db
      .insert(wallets)
      .values({
        ...wallet,
        balance: wallet.balance ? wallet.balance : "0",
      })
      .returning();
    return newWallet;
  }

  async updateWallet(id: number, updates: Partial<Wallet>): Promise<Wallet | undefined> {
    const [wallet] = await db
      .update(wallets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(wallets.id, id))
      .returning();
    return wallet || undefined;
  }

  async deleteWallet(id: number): Promise<boolean> {
    const result = await db.delete(wallets).where(eq(wallets.id, id));
    return result.rowCount > 0;
  }

  async updateWalletBalance(id: number, amount: number): Promise<Wallet | undefined> {
    const [wallet] = await db
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${amount}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.id, id))
      .returning();
    return wallet || undefined;
  }

  // Transaction methods
  async getTransactions(): Promise<(Transaction & { wallet: Wallet; creator: User })[]> {
    return await db
      .select({
        id: transactions.id,
        walletId: transactions.walletId,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        date: transactions.date,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
        wallet: wallets,
        creator: users,
      })
      .from(transactions)
      .leftJoin(wallets, eq(transactions.walletId, wallets.id))
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .orderBy(desc(transactions.date));
  }

  async getWalletTransactions(walletId: number): Promise<(Transaction & { creator: User })[]> {
    return await db
      .select({
        id: transactions.id,
        walletId: transactions.walletId,
        amount: transactions.amount,
        type: transactions.type,
        category: transactions.category,
        description: transactions.description,
        date: transactions.date,
        createdBy: transactions.createdBy,
        createdAt: transactions.createdAt,
        creator: users,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.createdBy, users.id))
      .where(eq(transactions.walletId, walletId))
      .orderBy(desc(transactions.date));
  }

  async createTransaction(transaction: InsertTransaction & { createdBy: number }): Promise<Transaction> {
    // Start a transaction to ensure wallet balance is updated atomically
    return await db.transaction(async (tx) => {
      // Insert the transaction
      const [newTransaction] = await tx
        .insert(transactions)
        .values(transaction)
        .returning();
      
      // Update wallet balance
      const amountChange = transaction.type === "income" ? Number(transaction.amount) : -Number(transaction.amount);
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amountChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, transaction.walletId));
      
      return newTransaction;
    });
  }

  async deleteTransaction(id: number): Promise<boolean> {
    // First get the transaction to know how to adjust the wallet balance
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id));
    
    if (!transaction) return false;
    
    // Start a transaction to ensure wallet balance is updated atomically
    return await db.transaction(async (tx) => {
      // Delete the transaction
      const result = await tx
        .delete(transactions)
        .where(eq(transactions.id, id));
      
      if (result.rowCount === 0) return false;
      
      // Update wallet balance (reverse the original transaction)
      const amountChange = transaction.type === "income" ? -Number(transaction.amount) : Number(transaction.amount);
      await tx
        .update(wallets)
        .set({
          balance: sql`${wallets.balance} + ${amountChange}`,
          updatedAt: new Date(),
        })
        .where(eq(wallets.id, transaction.walletId));
      
      return true;
    });
  }

  // Dues methods
  async getDues(): Promise<(Dues & { user: User })[]> {
    return await db
      .select({
        id: dues.id,
        userId: dues.userId,
        amount: dues.amount,
        dueDate: dues.dueDate,
        period: dues.period,
        status: dues.status,
        paymentDate: dues.paymentDate,
        paymentMethod: dues.paymentMethod,
        walletId: dues.walletId,
        notes: dues.notes,
        createdAt: dues.createdAt,
        updatedAt: dues.updatedAt,
        user: users,
      })
      .from(dues)
      .leftJoin(users, eq(dues.userId, users.id))
      .orderBy(desc(dues.period));
  }

  async getUserDues(userId: number): Promise<(Dues & { user: User })[]> {
    return await db
      .select({
        id: dues.id,
        userId: dues.userId,
        amount: dues.amount,
        dueDate: dues.dueDate,
        period: dues.period,
        status: dues.status,
        paymentDate: dues.paymentDate,
        paymentMethod: dues.paymentMethod,
        walletId: dues.walletId,
        notes: dues.notes,
        createdAt: dues.createdAt,
        updatedAt: dues.updatedAt,
        user: users,
      })
      .from(dues)
      .leftJoin(users, eq(dues.userId, users.id))
      .where(eq(dues.userId, userId))
      .orderBy(desc(dues.period));
  }

  async createDues(duesData: InsertDues): Promise<Dues> {
    const [newDues] = await db
      .insert(dues)
      .values(duesData)
      .returning();
    return newDues;
  }

  async updateDuesStatus(id: number, status: string, paymentDate?: Date, paymentMethod?: string, walletId?: number): Promise<Dues | undefined> {
    // Start a transaction if we're marking dues as paid and need to update wallet balance
    if (status === "paid" && walletId) {
      return await db.transaction(async (tx) => {
        // Get the dues amount
        const [duesRecord] = await tx
          .select()
          .from(dues)
          .where(eq(dues.id, id));
        
        if (!duesRecord) return undefined;
        
        // Update the dues status
        const [updatedDues] = await tx
          .update(dues)
          .set({
            status,
            paymentDate: paymentDate || new Date(),
            paymentMethod,
            walletId,
            updatedAt: new Date(),
          })
          .where(eq(dues.id, id))
          .returning();
        
        // Update wallet balance
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${duesRecord.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, walletId));
        
        return updatedDues;
      });
    } else {
      // Simple update without wallet balance change
      const [updatedDues] = await db
        .update(dues)
        .set({
          status,
          paymentDate,
          paymentMethod,
          walletId,
          updatedAt: new Date(),
        })
        .where(eq(dues.id, id))
        .returning();
      return updatedDues || undefined;
    }
  }

  // Initial Fee methods
  async getInitialFees(): Promise<(InitialFee & { user: User })[]> {
    return await db
      .select({
        id: initialFees.id,
        userId: initialFees.userId,
        amount: initialFees.amount,
        status: initialFees.status,
        paymentDate: initialFees.paymentDate,
        paymentMethod: initialFees.paymentMethod,
        walletId: initialFees.walletId,
        notes: initialFees.notes,
        createdAt: initialFees.createdAt,
        updatedAt: initialFees.updatedAt,
        user: users,
      })
      .from(initialFees)
      .leftJoin(users, eq(initialFees.userId, users.id))
      .orderBy(desc(initialFees.createdAt));
  }

  async getUserInitialFee(userId: number): Promise<InitialFee | undefined> {
    const [initialFee] = await db
      .select()
      .from(initialFees)
      .where(eq(initialFees.userId, userId));
    return initialFee || undefined;
  }

  async createInitialFee(initialFeeData: InsertInitialFee): Promise<InitialFee> {
    const [newInitialFee] = await db
      .insert(initialFees)
      .values(initialFeeData)
      .returning();
    return newInitialFee;
  }

  async updateInitialFeeStatus(id: number, status: string, paymentDate?: Date, paymentMethod?: string, walletId?: number): Promise<InitialFee | undefined> {
    // Start a transaction if we're marking initial fee as paid and need to update wallet balance
    if (status === "paid" && walletId) {
      return await db.transaction(async (tx) => {
        // Get the initial fee amount
        const [initialFeeRecord] = await tx
          .select()
          .from(initialFees)
          .where(eq(initialFees.id, id));
        
        if (!initialFeeRecord) return undefined;
        
        // Update the initial fee status
        const [updatedInitialFee] = await tx
          .update(initialFees)
          .set({
            status,
            paymentDate: paymentDate || new Date(),
            paymentMethod,
            walletId,
            updatedAt: new Date(),
          })
          .where(eq(initialFees.id, id))
          .returning();
        
        // Update wallet balance
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${initialFeeRecord.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, walletId));
        
        return updatedInitialFee;
      });
    } else {
      // Simple update without wallet balance change
      const [updatedInitialFee] = await db
        .update(initialFees)
        .set({
          status,
          paymentDate,
          paymentMethod,
          walletId,
          updatedAt: new Date(),
        })
        .where(eq(initialFees.id, id))
        .returning();
      return updatedInitialFee || undefined;
    }
  }

  // Donation methods
  async getDonations(): Promise<(Donation & { creator: User })[]> {

    return await db
      .select({
        id: donations.id,
        title: donations.title,
        description: donations.description,
        type: donations.type,
        amount: donations.amount,
        targetAmount: donations.targetAmount,
        status: donations.status,
        createdBy: donations.createdBy,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
        creator: users,
      })
      .from(donations)
      .leftJoin(users, eq(donations.createdBy, users.id))
      .orderBy(desc(donations.createdAt));
  }

  async getDonation(id: number): Promise<(Donation & { creator: User }) | undefined> {
    const [donation] = await db
      .select({
        id: donations.id,
        title: donations.title,
        description: donations.description,
        type: donations.type,
        amount: donations.amount,
        targetAmount: donations.targetAmount,
        status: donations.status,
        createdBy: donations.createdBy,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
        creator: users,
      })
      .from(donations)
      .leftJoin(users, eq(donations.createdBy, users.id))
      .where(eq(donations.id, id));
    
    return donation || undefined;
  }

  async getDonationsByType(type: string): Promise<(Donation & { creator: User })[]> {
    return await db
      .select({
        id: donations.id,
        title: donations.title,
        description: donations.description,
        type: donations.type,
        amount: donations.amount,
        targetAmount: donations.targetAmount,
        status: donations.status,
        createdBy: donations.createdBy,
        createdAt: donations.createdAt,
        updatedAt: donations.updatedAt,
        creator: users,
      })
      .from(donations)
      .leftJoin(users, eq(donations.createdBy, users.id))
      .where(eq(donations.type, type))
      .orderBy(desc(donations.createdAt));
  }

  async createDonation(donationData: InsertDonation & { createdBy: number }): Promise<Donation> {
    const [newDonation] = await db
      .insert(donations)
      .values(donationData)
      .returning();
    return newDonation;
  }

  async updateDonation(id: number, updates: Partial<Donation>): Promise<Donation | undefined> {
    const [updatedDonation] = await db
      .update(donations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donations.id, id))
      .returning();
    return updatedDonation || undefined;
  }

  async deleteDonation(id: number): Promise<boolean> {
    const result = await db.delete(donations).where(eq(donations.id, id));
    return result.rowCount > 0;
  }

  async updateDonationAmount(id: number, contributionAmount: number): Promise<Donation | undefined> {
    // Start a transaction to update donation amount
    return await db.transaction(async (tx) => {
      // Get the current donation
      const [donationRecord] = await tx
        .select()
        .from(donations)
        .where(eq(donations.id, id));
      
      if (!donationRecord) return undefined;
      
      // Update the donation amount by adding the contribution amount
      const [updatedDonation] = await tx
        .update(donations)
        .set({
          amount: sql`${donations.amount} + ${contributionAmount}`,
          updatedAt: new Date(),
          // If donation is fundraising and amount reaches or exceeds target, mark as completed
          status: donationRecord.type === 'fundraising' && donationRecord.targetAmount && 
                 (Number(donationRecord.amount) + contributionAmount >= Number(donationRecord.targetAmount)) ? 
                 'completed' : donations.status,
        })
        .where(eq(donations.id, id))
        .returning();
      
      return updatedDonation;
    });
  }

  // Donation contributor methods
  async getDonationContributors(donationId: number): Promise<(DonationContributor & { user: User })[]> {
    return await db
      .select({
        id: donationContributors.id,
        donationId: donationContributors.donationId,
        userId: donationContributors.userId,
        name: donationContributors.name,
        amount: donationContributors.amount,
        paymentMethod: donationContributors.paymentMethod,
        paymentDate: donationContributors.paymentDate,
        message: donationContributors.message,
        createdAt: donationContributors.createdAt,
        user: users,
      })
      .from(donationContributors)
      .leftJoin(users, eq(donationContributors.userId, users.id))
      .where(eq(donationContributors.donationId, donationId))
      .orderBy(desc(donationContributors.createdAt));
  }

  async createDonationContributor(contributorData: InsertDonationContributor & { donationId: number; userId: number; name: string }): Promise<DonationContributor> {
    return await db.transaction(async (tx) => {
      // Periksa status donasi terlebih dahulu
      const [donationRecord] = await tx
        .select()
        .from(donations)
        .where(eq(donations.id, contributorData.donationId));
      
      if (!donationRecord) {
        throw new Error("Donation not found");
      }
      
      // Periksa apakah donasi masih aktif
      if (donationRecord.status !== 'active') {
        throw new Error(`Donation is ${donationRecord.status} and cannot receive new contributions`);
      }
      
      // Periksa apakah donasi tipe fundraising sudah mencapai target
      if (donationRecord.type === 'fundraising' && donationRecord.targetAmount && 
          Number(donationRecord.amount) >= Number(donationRecord.targetAmount)) {
        throw new Error("Fundraising target has already been reached");
      }
      
      // Pastikan jumlah donasi positif
      if (Number(contributorData.amount) <= 0) {
        throw new Error("Contribution amount must be greater than zero");
      }
      
      // Insert the donation contributor
      const [newContributor] = await tx
        .insert(donationContributors)
        .values({
          ...contributorData,
          // Pastikan paymentMethod memiliki nilai default jika tidak disediakan
          paymentMethod: contributorData.paymentMethod || 'cash',
          // Pastikan paymentDate adalah objek Date yang valid
          paymentDate: contributorData.paymentDate instanceof Date ? 
                      contributorData.paymentDate : 
                      (contributorData.paymentDate ? 
                        (() => {
                          try {
                            const date = new Date(contributorData.paymentDate);
                            console.log('Storage - Converting paymentDate:', contributorData.paymentDate, 'to Date:', date);
                            if (isNaN(date.getTime())) {
                              console.log('Storage - Invalid date, using current date');
                              return new Date();
                            }
                            return date;
                          } catch (e) {
                            console.error('Storage - Error converting date:', e);
                            return new Date();
                          }
                        })() : 
                        new Date())
        })
        .returning();
      
      // If walletId is provided, update the wallet balance and record transaction
      if (contributorData.walletId) {
        // Update wallet balance
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} + ${contributorData.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, contributorData.walletId));
        
        // Record transaction for this donation contribution
        await tx
          .insert(transactions)
          .values({
            walletId: contributorData.walletId,
            amount: contributorData.amount,
            type: "income",
            category: "donation",
            description: `Kontribusi donasi: ${donationRecord.title} oleh ${contributorData.name}`,
            date: new Date(),
            createdBy: contributorData.userId
          });
      }
      
      // Update donation amount
      await tx
        .update(donations)
        .set({
          amount: sql`${donations.amount} + ${contributorData.amount}`,
          updatedAt: new Date(),
          // If donation is fundraising and amount reaches or exceeds target, mark as completed
          status: donationRecord.type === 'fundraising' && donationRecord.targetAmount && 
                 (Number(donationRecord.amount) + Number(contributorData.amount) >= Number(donationRecord.targetAmount)) ? 
                 'completed' : donations.status,
        })
        .where(eq(donations.id, contributorData.donationId));
      
      return newContributor;
    });
  }

  async deleteDonationContributor(id: number): Promise<boolean> {
    return await db.transaction(async (tx) => {
      // Get the contributor data first to update donation amount
      const [contributor] = await tx
        .select()
        .from(donationContributors)
        .where(eq(donationContributors.id, id));
      
      if (!contributor) return false;
      
      // Delete the contributor
      const result = await tx
        .delete(donationContributors)
        .where(eq(donationContributors.id, id));
      
      if (result.rowCount === 0) return false;
      
      // If walletId exists, update the wallet balance and record transaction
      if (contributor.walletId) {
        // Update wallet balance by subtracting the contribution amount
        await tx
          .update(wallets)
          .set({
            balance: sql`${wallets.balance} - ${contributor.amount}`,
            updatedAt: new Date(),
          })
          .where(eq(wallets.id, contributor.walletId));
        
        // Record transaction for this donation contribution deletion
        await tx
          .insert(transactions)
          .values({
            walletId: contributor.walletId,
            amount: contributor.amount,
            type: "expense",
            category: "donation",
            description: `Pembatalan kontribusi donasi ID: ${contributor.donationId}`,
            date: new Date(),
            createdBy: contributor.userId
          });
      }
      
      // Update donation amount by subtracting the contribution amount
      await tx
        .update(donations)
        .set({
          amount: sql`${donations.amount} - ${contributor.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(donations.id, contributor.donationId));
      
      return true;
    });
  }
}

export const storage = new DatabaseStorage();
