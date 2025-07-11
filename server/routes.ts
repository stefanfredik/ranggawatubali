import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import passport from "passport";
import { insertAnnouncementSchema, insertActivitySchema, insertPaymentSchema, insertUserSchema, insertWalletSchema, insertTransactionSchema, insertDuesSchema, insertInitialFeeSchema, insertDonationSchema, insertDonationContributorSchema } from "@shared/schema";
import upload, { handleMulterError, deleteProfilePicture } from "./upload";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  
  // Serve uploaded files
  app.use('/uploads', (req, res, next) => {
    // Basic security check to prevent directory traversal
    const requestedPath = req.path;
    console.log('==== STATIC FILE REQUEST ====');
    console.log('Requested upload path:', requestedPath);
    console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
    console.log('Request headers:', req.headers);
    
    // Check if the file exists
    const filePath = path.join(__dirname, '../uploads', requestedPath);
    console.log('Looking for file at:', filePath);
    try {
      const fileExists = fs.existsSync(filePath);
      console.log('File exists:', fileExists);
    } catch (error) {
      console.error('Error checking file existence:', error);
    }
    
    if (requestedPath.includes('..')) {
      return res.status(403).send('Forbidden');
    }
    next();
  }, express.static(path.join(__dirname, '../uploads')));
  
  console.log('Static file serving path:', path.join(__dirname, '../uploads'));

  // Authentication routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any | false, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error during authentication' });
      }
      
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      
      req.login(user, (err) => {
        if (err) {
          console.error('Session error during login:', err);
          return res.status(500).json({ message: 'Error creating session' });
        }
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

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
  
  // Profile picture upload route
  app.post("/api/members/:id/profile-picture", requireAuth, upload.single('profilePicture'), handleMulterError, async (req, res) => {
    console.log('==== PROFILE PICTURE UPLOAD ENDPOINT CALLED ====');
    try {
      console.log('Profile picture upload request received');
      console.log('Request body:', req.body);
      console.log('Request file:', req.file);
      
      const id = parseInt(req.params.id);
      console.log('Member ID:', id);
      
      // Only allow users to update their own profile picture, unless they're an admin
      if (req.user!.id !== id && req.user!.role !== "admin") {
        console.log('Permission denied: User trying to update another user\'s profile picture');
        return res.status(403).json({ message: "You can only update your own profile picture" });
      }
      
      if (!req.file) {
        console.log('Error: No file uploaded');
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const member = await storage.getUser(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Delete old profile picture if it exists
      if (member.profile_picture) {
        deleteProfilePicture(member.profile_picture);
      }
      
      // Log file information
      console.log('File successfully uploaded:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      });
      
      // Update user with new profile picture path
      const profilePicturePath = `/uploads/profile-pictures/${req.file.filename}`;
      console.log('Setting profile picture path:', profilePicturePath);
      
      try {
        const updatedUser = await storage.updateUser(id, { profile_picture: profilePicturePath });
        
        if (!updatedUser) {
          console.error('Failed to update user record with new profile picture');
          return res.status(500).json({ message: "Failed to update profile picture" });
        }
        
        console.log('User record updated successfully with new profile picture');
      } catch (error) {
        console.error('Database error when updating profile picture:', error);
        return res.status(500).json({ message: "Database error when updating profile picture" });
      }
      
      const updatedUser = await storage.getUser(id);
      if (!updatedUser) {
        console.error('Failed to retrieve updated user data');
        return res.status(500).json({ message: "Failed to retrieve updated user data" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      console.log('Sending successful response with updated user data');
      res.json({ 
        message: "Profile picture updated successfully", 
        user: userWithoutPassword 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to update profile picture" });
    }
  });
  
  // Delete profile picture route
  app.delete("/api/members/:id/profile-picture", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Only allow users to delete their own profile picture, unless they're an admin
      if (req.user!.id !== id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "You can only delete your own profile picture" });
      }
      
      const member = await storage.getUser(id);
      if (!member) {
        return res.status(404).json({ message: "Member not found" });
      }
      
      // Delete profile picture if it exists
      if (member.profile_picture) {
        deleteProfilePicture(member.profile_picture);
      }
      
      // Update user to remove profile picture path
      const updatedUser = await storage.updateUser(id, { profile_picture: null });
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to delete profile picture" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        message: "Profile picture deleted successfully", 
        user: userWithoutPassword 
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to delete profile picture" });
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

  // Wallet routes
  app.get("/api/wallets", requireAuth, async (req, res) => {
    try {
      const wallets = await storage.getWallets();
      res.json(wallets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallets" });
    }
  });

  app.get("/api/wallets/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const wallet = await storage.getWallet(id);
      
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet" });
    }
  });

  app.post("/api/wallets", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertWalletSchema.parse(req.body);
      const wallet = await storage.createWallet({
        ...validatedData,
        createdBy: req.user!.id,
      });
      res.status(201).json(wallet);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create wallet" });
    }
  });

  app.put("/api/wallets/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const wallet = await storage.updateWallet(id, updates);
      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.json(wallet);
    } catch (error) {
      res.status(500).json({ message: "Failed to update wallet" });
    }
  });

  app.delete("/api/wallets/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const success = await storage.deleteWallet(id);
      
      if (!success) {
        return res.status(404).json({ message: "Wallet not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete wallet" });
    }
  });

  // Transaction routes
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.get("/api/wallets/:id/transactions", requireAuth, async (req, res) => {
    try {
      const walletId = parseInt(req.params.id);
      const transactions = await storage.getWalletTransactions(walletId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wallet transactions" });
    }
  });

  app.post("/api/transactions", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction({
        ...validatedData,
        createdBy: req.user!.id,
      });
      res.status(201).json(transaction);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  app.delete("/api/transactions/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTransaction(id);
      
      if (!success) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  // Dues routes
  app.get("/api/dues", requireAdmin, async (req, res) => {
    try {
      const dues = await storage.getDues();
      res.json(dues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dues" });
    }
  });

  app.get("/api/dues/my", requireAuth, async (req, res) => {
    try {
      const dues = await storage.getUserDues(req.user!.id);
      res.json(dues);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your dues" });
    }
  });

  app.post("/api/dues", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertDuesSchema.parse(req.body);
      const dues = await storage.createDues(validatedData);
      res.status(201).json(dues);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create dues" });
    }
  });

  app.put("/api/dues/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, paymentDate, paymentMethod, walletId } = req.body;
      
      if (!status || !["paid", "unpaid"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const dues = await storage.updateDuesStatus(
        id, 
        status, 
        paymentDate ? new Date(paymentDate) : undefined, 
        paymentMethod, 
        walletId ? parseInt(walletId) : undefined
      );
      
      if (!dues) {
        return res.status(404).json({ message: "Dues not found" });
      }
      
      res.json(dues);
    } catch (error) {
      res.status(500).json({ message: "Failed to update dues status" });
    }
  });

  // Initial Fee routes
  app.get("/api/initial-fees", requireAdmin, async (req, res) => {
    try {
      const initialFees = await storage.getInitialFees();
      res.json(initialFees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch initial fees" });
    }
  });

  app.get("/api/initial-fees/my", requireAuth, async (req, res) => {
    try {
      const initialFee = await storage.getUserInitialFee(req.user!.id);
      res.json(initialFee || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch your initial fee" });
    }
  });

  app.post("/api/initial-fees", requireAdmin, async (req, res) => {
    try {
      const validatedData = insertInitialFeeSchema.parse(req.body);
      const initialFee = await storage.createInitialFee(validatedData);
      res.status(201).json(initialFee);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create initial fee" });
    }
  });

  app.put("/api/initial-fees/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, paymentDate, paymentMethod, walletId } = req.body;
      
      if (!status || !['paid', 'unpaid'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const initialFee = await storage.updateInitialFeeStatus(
        id, 
        status, 
        paymentDate ? new Date(paymentDate) : undefined, 
        paymentMethod, 
        walletId ? parseInt(walletId) : undefined
      );
      
      if (!initialFee) {
        return res.status(404).json({ message: "Initial fee not found" });
      }
      
      res.json(initialFee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update initial fee status" });
    }
  });

  // Donation routes
  app.get("/api/donations", requireAuth, async (req, res) => {
    try {
      const donations = await storage.getDonations();
      res.json(donations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donations" });
    }
  });

  app.get("/api/donations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const donation = await storage.getDonation(id);
      
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      res.json(donation);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donation" });
    }
  });

  app.get("/api/donations/type/:type", requireAuth, async (req, res) => {
    try {
      const type = req.params.type;
      if (!['happy', 'sad', 'fundraising'].includes(type)) {
        return res.status(400).json({ message: "Invalid donation type" });
      }
      
      const donations = await storage.getDonationsByType(type);
      res.json(donations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donations by type" });
    }
  });

  app.post("/api/donations", requireAuth, async (req, res) => {
    try {
      console.log('Received donation data:', req.body);
      
      const validatedData = insertDonationSchema.parse(req.body);
      console.log('Validated donation data:', validatedData);
      
      const donation = await storage.createDonation({
        ...validatedData,
        createdBy: req.user!.id,
      });
      
      console.log('Created donation:', donation);
      res.status(201).json(donation);
    } catch (error) {
      console.error('Error creating donation:', error);
      
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to create donation" });
    }
  });

  app.put("/api/donations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Verify ownership or admin status
      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      if (donation.createdBy !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "You can only update your own donations" });
      }
      
      const updatedDonation = await storage.updateDonation(id, updates);
      res.json(updatedDonation);
    } catch (error) {
      if (error.issues) {
        return res.status(400).json({ message: error.issues[0].message });
      }
      res.status(500).json({ message: "Failed to update donation" });
    }
  });

  app.delete("/api/donations/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verify ownership or admin status
      const donation = await storage.getDonation(id);
      if (!donation) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      if (donation.createdBy !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "You can only delete your own donations" });
      }
      
      const success = await storage.deleteDonation(id);
      
      if (!success) {
        return res.status(404).json({ message: "Donation not found" });
      }
      
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete donation" });
    }
  });

  // Donation contributors routes
  app.get("/api/donations/:id/contributors", requireAuth, async (req, res) => {
    try {
      const donationId = parseInt(req.params.id);
      const contributors = await storage.getDonationContributors(donationId);
      res.json(contributors);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch donation contributors" });
    }
  });

  // Endpoint untuk menambahkan kontributor donasi
  app.post('/api/donations/:donationId/contributors', requireAuth, async (req, res) => {
    try {
      // Konversi donationId dari string ke number
      const donationId = parseInt(req.params.donationId);
      if (isNaN(donationId)) {
        return res.status(400).json({ message: "ID donasi tidak valid" });
      }
      
      // Cek apakah donasi ada
      const donation = await storage.getDonation(donationId);
      if (!donation) {
        return res.status(404).json({ message: "Donasi tidak ditemukan" });
      }
      
      // Get the contributor data from request body
      const { contributorType, memberId, paymentMethod, ...contributorData } = req.body;
      
      // Log data yang diterima untuk debugging
      console.log('Received contributor data:', req.body);
      
      // Pastikan paymentMethod memiliki nilai default
      const validPaymentMethod = paymentMethod === 'transfer' ? 'transfer' : 'cash';
      
      // Determine which user ID to use based on contributor type
      let userId = req.user!.id;
      let name = req.user!.fullName;
      
      // If contributing on behalf of another member
      if (contributorType === 'member' && memberId) {
        const member = await storage.getUser(parseInt(memberId));
        if (!member) {
          return res.status(404).json({ message: "Anggota tidak ditemukan" });
        }
        userId = member.id;
        name = member.fullName;
      }
      
      // Check if wallet exists if walletId is provided
      if (contributorData.walletId) {
        const wallet = await storage.getWallet(contributorData.walletId);
        if (!wallet) {
          return res.status(404).json({ message: "Dompet tidak ditemukan" });
        }
      }
      
      // Validate and create contributor
      try {
        // Log data yang akan divalidasi untuk debugging
        console.log('Data yang akan divalidasi:', {
          ...contributorData,
          donationId,
          userId,
          name,
          paymentMethod: validPaymentMethod,
          paymentDate: contributorData.paymentDate ? new Date(contributorData.paymentDate) : new Date(),
        });
        
        // Pastikan amount adalah number atau string yang dapat dikonversi ke number
        let amount = contributorData.amount;
        if (typeof amount === 'string') {
          amount = parseFloat(amount);
          if (isNaN(amount)) {
            return res.status(400).json({ message: "Jumlah donasi harus berupa angka" });
          }
        }
        
        // Pastikan paymentDate adalah objek Date yang valid
        let paymentDate = contributorData.paymentDate;
        if (paymentDate && !(paymentDate instanceof Date)) {
          try {
            // Log untuk debugging
            console.log('PaymentDate before conversion:', paymentDate, typeof paymentDate);
            
            // Konversi ke Date object
            paymentDate = new Date(paymentDate);
            
            // Validasi hasil konversi
            if (isNaN(paymentDate.getTime())) {
              console.log('Invalid date after conversion');
              throw new Error("Invalid date");
            }
            
            console.log('PaymentDate after conversion:', paymentDate, typeof paymentDate);
            // Update contributorData dengan Date yang valid
            contributorData.paymentDate = paymentDate;
          } catch (error) {
            console.error('Error converting paymentDate:', error);
            return res.status(400).json({ message: "Tanggal pembayaran tidak valid" });
          }
        }
        
        const validatedData = insertDonationContributorSchema.parse({
          ...contributorData,
          amount,
          donationId,
          userId,
          name,
          paymentMethod: validPaymentMethod,
          paymentDate: paymentDate || new Date(),
        });
        
        const contributor = await storage.createDonationContributor({
          ...validatedData,
          donationId,
          userId,
          name,
          paymentMethod: validPaymentMethod,
          paymentDate: contributorData.paymentDate || new Date(),
        });
        
        // Update donation amount sudah dilakukan di dalam createDonationContributor
        
        return res.status(201).json(contributor);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        
        // Periksa apakah error berasal dari Zod
        if (validationError.issues || validationError.errors) {
          return res.status(400).json({ 
            message: "Validasi data gagal", 
            error: validationError.message || "Validation failed", 
            details: validationError.issues || validationError.errors || validationError
          });
        }
        
        // Error lainnya
        return res.status(500).json({ 
          message: "Terjadi kesalahan saat memproses kontribusi", 
          error: validationError.message || "Internal server error"
        });
      }
    } catch (error) {
      console.error('Error creating donation contribution:', error);
      
      // Handle Zod validation errors
      if (error.issues) {
        return res.status(400).json({ 
          message: "Validasi data gagal",
          error: error.issues[0].message,
          details: error.issues
        });
      }
      
      // Handle other specific errors
      if (error.message) {
        return res.status(400).json({ 
          message: "Gagal menambahkan kontribusi",
          error: error.message 
        });
      }
      
      // Generic error
      return res.status(500).json({ 
        message: "Gagal menambahkan kontribusi",
        error: "Terjadi kesalahan pada server" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
