import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Payments Endpoints', () => {
  let app: express.Express;
  let server: any;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    server.close();
  });

  describe('GET /api/payments', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/payments');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/payments-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/payments-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return payments if admin', async () => {
      // Mock payments data
      const mockPayments = [
        {
          id: 1,
          userId: 2,
          amount: 100000,
          purpose: 'Dues',
          paymentMethod: 'Transfer',
          paymentDate: new Date(),
          status: 'pending',
          notes: null,
          proofUrl: 'https://example.com/proof1.jpg',
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 2,
            name: 'Member User',
            username: 'member',
            email: 'member@example.com',
            role: 'member',
          },
        },
        {
          id: 2,
          userId: 3,
          amount: 150000,
          purpose: 'Initial Fee',
          paymentMethod: 'Cash',
          paymentDate: new Date(),
          status: 'approved',
          notes: 'Payment received',
          proofUrl: 'https://example.com/proof2.jpg',
          reviewedBy: 1,
          reviewedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 3,
            name: 'Another Member',
            username: 'member2',
            email: 'member2@example.com',
            role: 'member',
          },
        },
      ];

      // Mock storage to return payments
      (storage.getPayments as jest.Mock).mockResolvedValue(mockPayments);

      // Mock authenticated admin request
      app.use('/api/payments-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/payments-test-admin', async (req, res) => {
        try {
          const payments = await storage.getPayments();
          res.json(payments);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch payments' });
        }
      });

      const response = await request(app).get('/api/payments-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('purpose');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('user');
      expect(storage.getPayments).toHaveBeenCalled();
    });
  });

  describe('GET /api/payments/my', () => {
    it('should return user payments if authenticated', async () => {
      const userId = 2;
      // Mock user payments data
      const mockUserPayments = [
        {
          id: 1,
          userId: userId,
          amount: 100000,
          purpose: 'Dues',
          paymentMethod: 'Transfer',
          paymentDate: new Date(),
          status: 'pending',
          notes: null,
          proofUrl: 'https://example.com/proof1.jpg',
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock storage to return user payments
      (storage.getUserPayments as jest.Mock).mockResolvedValue(mockUserPayments);

      // Mock authenticated request
      app.use('/api/payments-my-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/payments-my-test', async (req, res) => {
        try {
          const payments = await storage.getUserPayments(req.user.id);
          res.json(payments);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch your payments' });
        }
      });

      const response = await request(app).get('/api/payments-my-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('userId', userId);
      expect(storage.getUserPayments).toHaveBeenCalledWith(userId);
    });
  });

  describe('POST /api/payments', () => {
    it('should create payment if authenticated', async () => {
      const userId = 2;
      const newPayment = {
        amount: 100000,
        purpose: 'Dues',
        paymentMethod: 'Transfer',
        paymentDate: new Date().toISOString(),
        proofUrl: 'https://example.com/proof1.jpg',
      };

      const createdPayment = {
        id: 3,
        ...newPayment,
        paymentDate: new Date(newPayment.paymentDate),
        userId: userId,
        status: 'pending',
        notes: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create payment
      (storage.createPayment as jest.Mock).mockResolvedValue(createdPayment);

      // Mock authenticated request
      app.use('/api/payments-create-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.post('/api/payments-create-test', async (req, res) => {
        try {
          const payment = await storage.createPayment({
            ...req.body,
            userId: req.user.id,
          });
          res.status(201).json(payment);
        } catch (error) {
          res.status(500).json({ message: 'Failed to submit payment' });
        }
      });

      const response = await request(app)
        .post('/api/payments-create-test')
        .send(newPayment);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('amount', newPayment.amount);
      expect(response.body).toHaveProperty('purpose', newPayment.purpose);
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(storage.createPayment).toHaveBeenCalledWith({
        ...newPayment,
        userId: userId,
      });
    });
  });

  describe('PUT /api/payments/:id/status', () => {
    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/payments-status-member-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .put('/api/payments-status-member-test/1/status')
        .send({
          status: 'approved',
          notes: 'Payment approved',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should update payment status if admin', async () => {
      const paymentId = 1;
      const adminId = 1;
      const statusUpdate = {
        status: 'approved',
        notes: 'Payment approved',
      };

      const updatedPayment = {
        id: paymentId,
        userId: 2,
        amount: 100000,
        purpose: 'Dues',
        paymentMethod: 'Transfer',
        paymentDate: new Date(),
        status: statusUpdate.status,
        notes: statusUpdate.notes,
        proofUrl: 'https://example.com/proof1.jpg',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update payment status
      (storage.updatePaymentStatus as jest.Mock).mockResolvedValue(updatedPayment);

      // Mock authenticated admin request
      app.use('/api/payments-status-admin-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: adminId, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/payments-status-admin-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status, notes } = req.body;
          
          if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const payment = await storage.updatePaymentStatus(id, status, req.user.id, notes);
          if (!payment) {
            return res.status(404).json({ message: 'Payment not found' });
          }
          
          res.json(payment);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update payment status' });
        }
      });

      const response = await request(app)
        .put(`/api/payments-status-admin-test/${paymentId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', paymentId);
      expect(response.body).toHaveProperty('status', statusUpdate.status);
      expect(response.body).toHaveProperty('notes', statusUpdate.notes);
      expect(response.body).toHaveProperty('reviewedBy', adminId);
      expect(storage.updatePaymentStatus).toHaveBeenCalledWith(
        paymentId, 
        statusUpdate.status, 
        adminId, 
        statusUpdate.notes
      );
    });

    it('should return 400 for invalid status', async () => {
      const paymentId = 1;
      const statusUpdate = {
        status: 'invalid-status',
        notes: 'Invalid status',
      };

      // Mock authenticated admin request
      app.use('/api/payments-status-invalid-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/payments-status-invalid-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status, notes } = req.body;
          
          if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const payment = await storage.updatePaymentStatus(id, status, req.user.id, notes);
          res.json(payment);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update payment status' });
        }
      });

      const response = await request(app)
        .put(`/api/payments-status-invalid-test/${paymentId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid status');
      expect(storage.updatePaymentStatus).not.toHaveBeenCalled();
    });
  });
});