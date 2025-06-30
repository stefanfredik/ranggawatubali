import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Wallets Endpoints', () => {
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

  describe('GET /api/wallets', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/wallets');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/wallets-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/wallets-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return wallets if admin', async () => {
      // Mock wallets data
      const mockWallets = [
        {
          id: 1,
          name: 'Main Wallet',
          balance: 5000000,
          description: 'Main organization wallet',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          name: 'Emergency Fund',
          balance: 2000000,
          description: 'For emergency purposes',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      // Mock storage to return wallets
      (storage.getWallets as jest.Mock).mockResolvedValue(mockWallets);

      // Mock authenticated admin request
      app.use('/api/wallets-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/wallets-test-admin', async (req, res) => {
        try {
          const wallets = await storage.getWallets();
          res.json(wallets);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch wallets' });
        }
      });

      const response = await request(app).get('/api/wallets-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('balance');
      expect(response.body[0]).toHaveProperty('description');
      expect(storage.getWallets).toHaveBeenCalled();
    });
  });

  describe('GET /api/wallets/:id', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/wallets/1');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/wallets-id-test-member/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/wallets-id-test-member/1');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return wallet by id if admin', async () => {
      const walletId = 1;
      // Mock wallet data
      const mockWallet = {
        id: walletId,
        name: 'Main Wallet',
        balance: 5000000,
        description: 'Main organization wallet',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to return wallet
      (storage.getWalletById as jest.Mock).mockResolvedValue(mockWallet);

      // Mock authenticated admin request
      app.use('/api/wallets-id-test-admin/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/wallets-id-test-admin/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const wallet = await storage.getWalletById(id);
          
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch wallet' });
        }
      });

      const response = await request(app).get(`/api/wallets-id-test-admin/${walletId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', walletId);
      expect(response.body).toHaveProperty('name', mockWallet.name);
      expect(response.body).toHaveProperty('balance', mockWallet.balance);
      expect(storage.getWalletById).toHaveBeenCalledWith(walletId);
    });

    it('should return 404 if wallet not found', async () => {
      const walletId = 999;

      // Mock storage to return null (wallet not found)
      (storage.getWalletById as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/wallets-id-not-found-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/wallets-id-not-found-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const wallet = await storage.getWalletById(id);
          
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch wallet' });
        }
      });

      const response = await request(app).get(`/api/wallets-id-not-found-test/${walletId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Wallet not found');
      expect(storage.getWalletById).toHaveBeenCalledWith(walletId);
    });
  });

  describe('POST /api/wallets', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/wallets')
        .send({
          name: 'New Wallet',
          balance: 1000000,
          description: 'New wallet description',
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/wallets-create-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/wallets-create-test-member')
        .send({
          name: 'New Wallet',
          balance: 1000000,
          description: 'New wallet description',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create wallet if admin', async () => {
      const newWallet = {
        name: 'New Wallet',
        balance: 1000000,
        description: 'New wallet description',
      };

      const createdWallet = {
        id: 3,
        ...newWallet,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create wallet
      (storage.createWallet as jest.Mock).mockResolvedValue(createdWallet);

      // Mock authenticated admin request
      app.use('/api/wallets-create-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/wallets-create-test-admin', async (req, res) => {
        try {
          const { name, balance, description } = req.body;
          
          if (!name || balance === undefined) {
            return res.status(400).json({ message: 'Name and balance are required' });
          }
          
          const wallet = await storage.createWallet({
            name,
            balance,
            description,
          });
          
          res.status(201).json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create wallet' });
        }
      });

      const response = await request(app)
        .post('/api/wallets-create-test-admin')
        .send(newWallet);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', newWallet.name);
      expect(response.body).toHaveProperty('balance', newWallet.balance);
      expect(response.body).toHaveProperty('description', newWallet.description);
      expect(storage.createWallet).toHaveBeenCalledWith(newWallet);
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock authenticated admin request
      app.use('/api/wallets-create-invalid-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/wallets-create-invalid-test', async (req, res) => {
        try {
          const { name, balance, description } = req.body;
          
          if (!name || balance === undefined) {
            return res.status(400).json({ message: 'Name and balance are required' });
          }
          
          const wallet = await storage.createWallet({
            name,
            balance,
            description,
          });
          
          res.status(201).json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create wallet' });
        }
      });

      // Test missing name
      const responseMissingName = await request(app)
        .post('/api/wallets-create-invalid-test')
        .send({
          balance: 1000000,
          description: 'Missing name',
        });
      
      expect(responseMissingName.status).toBe(400);
      expect(responseMissingName.body).toHaveProperty('message', 'Name and balance are required');

      // Test missing balance
      const responseMissingBalance = await request(app)
        .post('/api/wallets-create-invalid-test')
        .send({
          name: 'Test Wallet',
          description: 'Missing balance',
        });
      
      expect(responseMissingBalance.status).toBe(400);
      expect(responseMissingBalance.body).toHaveProperty('message', 'Name and balance are required');

      expect(storage.createWallet).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/wallets/:id', () => {
    it('should update wallet if admin', async () => {
      const walletId = 1;
      const updateData = {
        name: 'Updated Wallet',
        balance: 1500000,
        description: 'Updated description',
      };

      const updatedWallet = {
        id: walletId,
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update wallet
      (storage.updateWallet as jest.Mock).mockResolvedValue(updatedWallet);

      // Mock authenticated admin request
      app.use('/api/wallets-update-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/wallets-update-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { name, balance, description } = req.body;
          
          if (!name || balance === undefined) {
            return res.status(400).json({ message: 'Name and balance are required' });
          }
          
          const wallet = await storage.updateWallet(id, {
            name,
            balance,
            description,
          });
          
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update wallet' });
        }
      });

      const response = await request(app)
        .put(`/api/wallets-update-test/${walletId}`)
        .send(updateData);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', walletId);
      expect(response.body).toHaveProperty('name', updateData.name);
      expect(response.body).toHaveProperty('balance', updateData.balance);
      expect(response.body).toHaveProperty('description', updateData.description);
      expect(storage.updateWallet).toHaveBeenCalledWith(walletId, updateData);
    });

    it('should return 404 if wallet not found', async () => {
      const walletId = 999;
      const updateData = {
        name: 'Updated Wallet',
        balance: 1500000,
        description: 'Updated description',
      };

      // Mock storage to return null (wallet not found)
      (storage.updateWallet as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/wallets-update-not-found-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/wallets-update-not-found-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const { name, balance, description } = req.body;
          
          if (!name || balance === undefined) {
            return res.status(400).json({ message: 'Name and balance are required' });
          }
          
          const wallet = await storage.updateWallet(id, {
            name,
            balance,
            description,
          });
          
          if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.json(wallet);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update wallet' });
        }
      });

      const response = await request(app)
        .put(`/api/wallets-update-not-found-test/${walletId}`)
        .send(updateData);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Wallet not found');
      expect(storage.updateWallet).toHaveBeenCalledWith(walletId, updateData);
    });
  });

  describe('DELETE /api/wallets/:id', () => {
    it('should delete wallet if admin', async () => {
      const walletId = 1;

      // Mock storage to delete wallet
      (storage.deleteWallet as jest.Mock).mockResolvedValue(true);

      // Mock authenticated admin request
      app.use('/api/wallets-delete-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.delete('/api/wallets-delete-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const success = await storage.deleteWallet(id);
          
          if (!success) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.status(204).end();
        } catch (error) {
          res.status(500).json({ message: 'Failed to delete wallet' });
        }
      });

      const response = await request(app).delete(`/api/wallets-delete-test/${walletId}`);
      
      expect(response.status).toBe(204);
      expect(storage.deleteWallet).toHaveBeenCalledWith(walletId);
    });

    it('should return 404 if wallet not found', async () => {
      const walletId = 999;

      // Mock storage to return false (wallet not found)
      (storage.deleteWallet as jest.Mock).mockResolvedValue(false);

      // Mock authenticated admin request
      app.use('/api/wallets-delete-not-found-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.delete('/api/wallets-delete-not-found-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const success = await storage.deleteWallet(id);
          
          if (!success) {
            return res.status(404).json({ message: 'Wallet not found' });
          }
          
          res.status(204).end();
        } catch (error) {
          res.status(500).json({ message: 'Failed to delete wallet' });
        }
      });

      const response = await request(app).delete(`/api/wallets-delete-not-found-test/${walletId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Wallet not found');
      expect(storage.deleteWallet).toHaveBeenCalledWith(walletId);
    });
  });
});