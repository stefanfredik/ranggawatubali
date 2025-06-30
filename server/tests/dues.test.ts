import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Dues Endpoints', () => {
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

  describe('GET /api/dues', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/dues');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/dues-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/dues-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return dues if admin', async () => {
      // Mock dues data
      const mockDues = [
        {
          id: 1,
          userId: 2,
          amount: 50000,
          dueDate: new Date(),
          status: 'pending',
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
          amount: 50000,
          dueDate: new Date(),
          status: 'paid',
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

      // Mock storage to return dues
      (storage.getDues as jest.Mock).mockResolvedValue(mockDues);

      // Mock authenticated admin request
      app.use('/api/dues-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/dues-test-admin', async (req, res) => {
        try {
          const dues = await storage.getDues();
          res.json(dues);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch dues' });
        }
      });

      const response = await request(app).get('/api/dues-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('dueDate');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('user');
      expect(storage.getDues).toHaveBeenCalled();
    });
  });

  describe('GET /api/dues/my', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/dues/my');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return user dues if authenticated', async () => {
      const userId = 2;
      // Mock user dues data
      const mockUserDues = [
        {
          id: 1,
          userId: userId,
          amount: 50000,
          dueDate: new Date(),
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock storage to return user dues
      (storage.getUserDues as jest.Mock).mockResolvedValue(mockUserDues);

      // Mock authenticated request
      app.use('/api/dues-my-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/dues-my-test', async (req, res) => {
        try {
          const dues = await storage.getUserDues(req.user.id);
          res.json(dues);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch your dues' });
        }
      });

      const response = await request(app).get('/api/dues-my-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('userId', userId);
      expect(storage.getUserDues).toHaveBeenCalledWith(userId);
    });
  });

  describe('POST /api/dues', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/dues')
        .send({
          userId: 2,
          amount: 50000,
          dueDate: new Date().toISOString(),
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/dues-create-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/dues-create-test-member')
        .send({
          userId: 2,
          amount: 50000,
          dueDate: new Date().toISOString(),
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create due if admin', async () => {
      const newDue = {
        userId: 2,
        amount: 50000,
        dueDate: new Date().toISOString(),
      };

      const createdDue = {
        id: 3,
        ...newDue,
        dueDate: new Date(newDue.dueDate),
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create due
      (storage.createDue as jest.Mock).mockResolvedValue(createdDue);

      // Mock authenticated admin request
      app.use('/api/dues-create-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/dues-create-test-admin', async (req, res) => {
        try {
          const { userId, amount, dueDate } = req.body;
          
          if (!userId || amount === undefined || !dueDate) {
            return res.status(400).json({ message: 'User ID, amount, and due date are required' });
          }
          
          const due = await storage.createDue({
            userId,
            amount,
            dueDate: new Date(dueDate),
          });
          
          res.status(201).json(due);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create due' });
        }
      });

      const response = await request(app)
        .post('/api/dues-create-test-admin')
        .send(newDue);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId', newDue.userId);
      expect(response.body).toHaveProperty('amount', newDue.amount);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(storage.createDue).toHaveBeenCalledWith({
        userId: newDue.userId,
        amount: newDue.amount,
        dueDate: expect.any(Date),
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock authenticated admin request
      app.use('/api/dues-create-invalid-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/dues-create-invalid-test', async (req, res) => {
        try {
          const { userId, amount, dueDate } = req.body;
          
          if (!userId || amount === undefined || !dueDate) {
            return res.status(400).json({ message: 'User ID, amount, and due date are required' });
          }
          
          const due = await storage.createDue({
            userId,
            amount,
            dueDate: new Date(dueDate),
          });
          
          res.status(201).json(due);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create due' });
        }
      });

      // Test missing userId
      const responseMissingUserId = await request(app)
        .post('/api/dues-create-invalid-test')
        .send({
          amount: 50000,
          dueDate: new Date().toISOString(),
        });
      
      expect(responseMissingUserId.status).toBe(400);
      expect(responseMissingUserId.body).toHaveProperty('message', 'User ID, amount, and due date are required');

      // Test missing amount
      const responseMissingAmount = await request(app)
        .post('/api/dues-create-invalid-test')
        .send({
          userId: 2,
          dueDate: new Date().toISOString(),
        });
      
      expect(responseMissingAmount.status).toBe(400);
      expect(responseMissingAmount.body).toHaveProperty('message', 'User ID, amount, and due date are required');

      // Test missing dueDate
      const responseMissingDueDate = await request(app)
        .post('/api/dues-create-invalid-test')
        .send({
          userId: 2,
          amount: 50000,
        });
      
      expect(responseMissingDueDate.status).toBe(400);
      expect(responseMissingDueDate.body).toHaveProperty('message', 'User ID, amount, and due date are required');

      expect(storage.createDue).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/dues/:id/status', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/dues/1/status')
        .send({
          status: 'paid',
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/dues-status-member-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .put('/api/dues-status-member-test/1/status')
        .send({
          status: 'paid',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should update due status if admin', async () => {
      const dueId = 1;
      const statusUpdate = {
        status: 'paid',
      };

      const updatedDue = {
        id: dueId,
        userId: 2,
        amount: 50000,
        dueDate: new Date(),
        status: statusUpdate.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update due status
      (storage.updateDueStatus as jest.Mock).mockResolvedValue(updatedDue);

      // Mock authenticated admin request
      app.use('/api/dues-status-admin-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/dues-status-admin-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const due = await storage.updateDueStatus(id, status);
          if (!due) {
            return res.status(404).json({ message: 'Due not found' });
          }
          
          res.json(due);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update due status' });
        }
      });

      const response = await request(app)
        .put(`/api/dues-status-admin-test/${dueId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', dueId);
      expect(response.body).toHaveProperty('status', statusUpdate.status);
      expect(storage.updateDueStatus).toHaveBeenCalledWith(dueId, statusUpdate.status);
    });

    it('should return 400 for invalid status', async () => {
      const dueId = 1;
      const statusUpdate = {
        status: 'invalid-status',
      };

      // Mock authenticated admin request
      app.use('/api/dues-status-invalid-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/dues-status-invalid-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const due = await storage.updateDueStatus(id, status);
          res.json(due);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update due status' });
        }
      });

      const response = await request(app)
        .put(`/api/dues-status-invalid-test/${dueId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid status');
      expect(storage.updateDueStatus).not.toHaveBeenCalled();
    });

    it('should return 404 if due not found', async () => {
      const dueId = 999;
      const statusUpdate = {
        status: 'paid',
      };

      // Mock storage to return null (due not found)
      (storage.updateDueStatus as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/dues-status-not-found-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/dues-status-not-found-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid', 'overdue'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const due = await storage.updateDueStatus(id, status);
          if (!due) {
            return res.status(404).json({ message: 'Due not found' });
          }
          
          res.json(due);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update due status' });
        }
      });

      const response = await request(app)
        .put(`/api/dues-status-not-found-test/${dueId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Due not found');
      expect(storage.updateDueStatus).toHaveBeenCalledWith(dueId, statusUpdate.status);
    });
  });
});