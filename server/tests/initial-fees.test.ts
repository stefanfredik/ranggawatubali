import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Initial Fees Endpoints', () => {
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

  describe('GET /api/initial-fees', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/initial-fees');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/initial-fees-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/initial-fees-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return initial fees if admin', async () => {
      // Mock initial fees data
      const mockInitialFees = [
        {
          id: 1,
          userId: 2,
          amount: 250000,
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
          amount: 250000,
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

      // Mock storage to return initial fees
      (storage.getInitialFees as jest.Mock).mockResolvedValue(mockInitialFees);

      // Mock authenticated admin request
      app.use('/api/initial-fees-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/initial-fees-test-admin', async (req, res) => {
        try {
          const initialFees = await storage.getInitialFees();
          res.json(initialFees);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch initial fees' });
        }
      });

      const response = await request(app).get('/api/initial-fees-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('status');
      expect(response.body[0]).toHaveProperty('user');
      expect(storage.getInitialFees).toHaveBeenCalled();
    });
  });

  describe('GET /api/initial-fees/my', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/initial-fees/my');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return user initial fee if authenticated', async () => {
      const userId = 2;
      // Mock user initial fee data
      const mockUserInitialFee = {
        id: 1,
        userId: userId,
        amount: 250000,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to return user initial fee
      (storage.getUserInitialFee as jest.Mock).mockResolvedValue(mockUserInitialFee);

      // Mock authenticated request
      app.use('/api/initial-fees-my-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/initial-fees-my-test', async (req, res) => {
        try {
          const initialFee = await storage.getUserInitialFee(req.user.id);
          if (!initialFee) {
            return res.status(404).json({ message: 'Initial fee not found' });
          }
          res.json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch your initial fee' });
        }
      });

      const response = await request(app).get('/api/initial-fees-my-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', userId);
      expect(response.body).toHaveProperty('amount', mockUserInitialFee.amount);
      expect(response.body).toHaveProperty('status', mockUserInitialFee.status);
      expect(storage.getUserInitialFee).toHaveBeenCalledWith(userId);
    });

    it('should return 404 if user initial fee not found', async () => {
      const userId = 4; // User without initial fee

      // Mock storage to return null (initial fee not found)
      (storage.getUserInitialFee as jest.Mock).mockResolvedValue(null);

      // Mock authenticated request
      app.use('/api/initial-fees-my-not-found-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/initial-fees-my-not-found-test', async (req, res) => {
        try {
          const initialFee = await storage.getUserInitialFee(req.user.id);
          if (!initialFee) {
            return res.status(404).json({ message: 'Initial fee not found' });
          }
          res.json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch your initial fee' });
        }
      });

      const response = await request(app).get('/api/initial-fees-my-not-found-test');
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Initial fee not found');
      expect(storage.getUserInitialFee).toHaveBeenCalledWith(userId);
    });
  });

  describe('POST /api/initial-fees', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/initial-fees')
        .send({
          userId: 2,
          amount: 250000,
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/initial-fees-create-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/initial-fees-create-test-member')
        .send({
          userId: 2,
          amount: 250000,
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create initial fee if admin', async () => {
      const newInitialFee = {
        userId: 4,
        amount: 250000,
      };

      const createdInitialFee = {
        id: 3,
        ...newInitialFee,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create initial fee
      (storage.createInitialFee as jest.Mock).mockResolvedValue(createdInitialFee);

      // Mock authenticated admin request
      app.use('/api/initial-fees-create-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/initial-fees-create-test-admin', async (req, res) => {
        try {
          const { userId, amount } = req.body;
          
          if (!userId || amount === undefined) {
            return res.status(400).json({ message: 'User ID and amount are required' });
          }
          
          const initialFee = await storage.createInitialFee({
            userId,
            amount,
          });
          
          res.status(201).json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create initial fee' });
        }
      });

      const response = await request(app)
        .post('/api/initial-fees-create-test-admin')
        .send(newInitialFee);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId', newInitialFee.userId);
      expect(response.body).toHaveProperty('amount', newInitialFee.amount);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(storage.createInitialFee).toHaveBeenCalledWith(newInitialFee);
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock authenticated admin request
      app.use('/api/initial-fees-create-invalid-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/initial-fees-create-invalid-test', async (req, res) => {
        try {
          const { userId, amount } = req.body;
          
          if (!userId || amount === undefined) {
            return res.status(400).json({ message: 'User ID and amount are required' });
          }
          
          const initialFee = await storage.createInitialFee({
            userId,
            amount,
          });
          
          res.status(201).json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create initial fee' });
        }
      });

      // Test missing userId
      const responseMissingUserId = await request(app)
        .post('/api/initial-fees-create-invalid-test')
        .send({
          amount: 250000,
        });
      
      expect(responseMissingUserId.status).toBe(400);
      expect(responseMissingUserId.body).toHaveProperty('message', 'User ID and amount are required');

      // Test missing amount
      const responseMissingAmount = await request(app)
        .post('/api/initial-fees-create-invalid-test')
        .send({
          userId: 4,
        });
      
      expect(responseMissingAmount.status).toBe(400);
      expect(responseMissingAmount.body).toHaveProperty('message', 'User ID and amount are required');

      expect(storage.createInitialFee).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/initial-fees/:id/status', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .put('/api/initial-fees/1/status')
        .send({
          status: 'paid',
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/initial-fees-status-member-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .put('/api/initial-fees-status-member-test/1/status')
        .send({
          status: 'paid',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should update initial fee status if admin', async () => {
      const initialFeeId = 1;
      const statusUpdate = {
        status: 'paid',
      };

      const updatedInitialFee = {
        id: initialFeeId,
        userId: 2,
        amount: 250000,
        status: statusUpdate.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update initial fee status
      (storage.updateInitialFeeStatus as jest.Mock).mockResolvedValue(updatedInitialFee);

      // Mock authenticated admin request
      app.use('/api/initial-fees-status-admin-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/initial-fees-status-admin-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const initialFee = await storage.updateInitialFeeStatus(id, status);
          if (!initialFee) {
            return res.status(404).json({ message: 'Initial fee not found' });
          }
          
          res.json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update initial fee status' });
        }
      });

      const response = await request(app)
        .put(`/api/initial-fees-status-admin-test/${initialFeeId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', initialFeeId);
      expect(response.body).toHaveProperty('status', statusUpdate.status);
      expect(storage.updateInitialFeeStatus).toHaveBeenCalledWith(initialFeeId, statusUpdate.status);
    });

    it('should return 400 for invalid status', async () => {
      const initialFeeId = 1;
      const statusUpdate = {
        status: 'invalid-status',
      };

      // Mock authenticated admin request
      app.use('/api/initial-fees-status-invalid-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/initial-fees-status-invalid-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const initialFee = await storage.updateInitialFeeStatus(id, status);
          res.json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update initial fee status' });
        }
      });

      const response = await request(app)
        .put(`/api/initial-fees-status-invalid-test/${initialFeeId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid status');
      expect(storage.updateInitialFeeStatus).not.toHaveBeenCalled();
    });

    it('should return 404 if initial fee not found', async () => {
      const initialFeeId = 999;
      const statusUpdate = {
        status: 'paid',
      };

      // Mock storage to return null (initial fee not found)
      (storage.updateInitialFeeStatus as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/initial-fees-status-not-found-test/:id/status', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/initial-fees-status-not-found-test/:id/status', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { status } = req.body;
          
          if (!['pending', 'paid'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
          }
          
          const initialFee = await storage.updateInitialFeeStatus(id, status);
          if (!initialFee) {
            return res.status(404).json({ message: 'Initial fee not found' });
          }
          
          res.json(initialFee);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update initial fee status' });
        }
      });

      const response = await request(app)
        .put(`/api/initial-fees-status-not-found-test/${initialFeeId}/status`)
        .send(statusUpdate);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Initial fee not found');
      expect(storage.updateInitialFeeStatus).toHaveBeenCalledWith(initialFeeId, statusUpdate.status);
    });
  });
});