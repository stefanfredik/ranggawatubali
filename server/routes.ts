import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertAnnouncementSchema, insertActivitySchema, insertPaymentSchema, insertUserSchema } from "@shared/schema";

function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

function requireAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated() || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Dashboard stats (admin only)
  app.get("/api/dashboard/stats", requireAdmin, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get("/api/dashboard/birthdays", requireAuth, async (req, res) => {
    try {
      const birthdays = await storage.getUpcomingBirthdays();
      res.json(birthdays);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch upcoming birthdays" });
    }
  });

  // Member management routes (admin only)
  app.get("/api/members", requireAdmin, async (req, res) => {
    try {
      const members = await storage.getAllMembers();
      const membersWithoutPasswords = members.map(({ password, ...member }) => member);
      res.json(membersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  app.post("/api/members", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const existingEmail = await storage.getUserByEmail(validatedData.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(validatedData.password);
      
      const member = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });
      
      const { password, ...memberWithoutPassword } = member;
      res.status(201).json(memberWithoutPassword);
    } catch (error: any) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create member" });
    }
  });

  app.put("/api/members/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      delete updates.password; // Don't allow password updates through this route
      
      const member = await storage.updateUser(id, updates);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      const { password, ...memberWithoutPassword } = member;
      res.json(memberWithoutPassword);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update member" });
    }
  });

  app.delete("/api/members/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Prevent deleting yourself
      if (req.user!.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      const member = await storage.getUser(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Use raw SQL to delete the user since we don't have a deleteUser method
      await storage.deleteUser(id);
      res.json({ message: "Member deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete member" });
    }
  });

  app.patch("/api/members/:id/password", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { password } = req.body;

      if (!password || password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }

      const member = await storage.getUser(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }

      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      const updatedUser = await storage.updateUser(id, { password: hashedPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update password" });
      }
      
      res.json({ message: "Password updated successfully" });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Announcement routes
  app.get("/api/announcements", requireAuth, async (req, res) => {
    try {
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch announcements" });
    }
  });

  app.post("/api/announcements", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertAnnouncementSchema.parse(req.body);
      const announcement = await storage.createAnnouncement({
        ...validatedData,
        authorId: req.user!.id,
      });
      res.status(201).json(announcement);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create announcement" });
    }
  });

  app.put("/api/announcements/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const announcement = await storage.updateAnnouncement(id, updates);
      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ message: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAnnouncement(id);
      
      if (!success) {
        return res.status(404).json({ message: "Announcement not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete announcement" });
    }
  });

  // Activity routes
  app.get("/api/activities", requireAuth, async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.post("/api/activities", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity({
        ...validatedData,
        createdBy: req.user!.id,
      });
      res.status(201).json(activity);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  app.put("/api/activities/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const activity = await storage.updateActivity(id, updates);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  app.delete("/api/activities/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteActivity(id);
      
      if (!success) {
        return res.status(404).json({ message: "Activity not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete activity" });
    }
  });

  // Payment routes
  app.get("/api/payments", requireAdmin, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/my", requireAuth, async (req, res) => {
    try {
      const payments = await storage.getUserPayments(req.user!.id);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your payments" });
    }
  });

  app.post("/api/payments", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      const payment = await storage.createPayment({
        ...validatedData,
        userId: req.user!.id,
      });
      res.status(201).json(payment);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to submit payment" });
    }
  });

  app.put("/api/payments/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, notes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const payment = await storage.updatePaymentStatus(id, status, req.user!.id, notes);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }
      
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
