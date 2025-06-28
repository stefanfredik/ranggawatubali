import { users, announcements, activities, payments, activityParticipants, type User, type InsertUser, type Announcement, type InsertAnnouncement, type Activity, type InsertActivity, type Payment, type InsertPayment } from "@shared/schema";
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

  // Dashboard stats
  getDashboardStats(): Promise<{
    totalMembers: number;
    activeActivities: number;
    pendingPayments: number;
    birthdaysThisMonth: number;
  }>;

  getUpcomingBirthdays(): Promise<User[]>;

  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
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

    return {
      totalMembers: totalMembersResult.count,
      activeActivities: activeActivitiesResult.count,
      pendingPayments: pendingPaymentsResult.count,
      birthdaysThisMonth: birthdaysResult.count,
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
}

export const storage = new DatabaseStorage();
