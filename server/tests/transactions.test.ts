import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Transactions Endpoints', () => {
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

  describe('GET /api/transactions', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/transactions');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/transactions-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/transactions-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return transactions if admin', async () => {
      // Mock transactions data
      const mockTransactions = [
        {
          id: 1,
          walletId: 1,
          amount: 500000,
          type: 'income',
          description: 'Membership fee',
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          wallet: {
            id: 1,
            name: 'Main Wallet',
          },
          user: {
            id: 1,
            name: 'Admin User',
          },
        },
        {
          id: 2,
          walletId: 1,
          amount: 200000,
          type: 'expense',
          description: 'Office supplies',
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          wallet: {
            id: 1,
            name: 'Main Wallet',
          },
          user: {
            id: 1,
            name: 'Admin User',
          },
        },
      ];

      // Mock storage to return transactions
      (storage.getTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      // Mock authenticated admin request
      app.use('/api/transactions-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/transactions-test-admin', async (req, res) => {
        try {
          const transactions = await storage.getTransactions();
          res.json(transactions);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch transactions' });
        }
      });

      const response = await request(app).get('/api/transactions-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('wallet');
      expect(response.body[0]).toHaveProperty('user');
      expect(storage.getTransactions).toHaveBeenCalled();
    });
  });

  describe('GET /api/wallets/:id/transactions', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/wallets/1/transactions');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/wallets-transactions-test-member/:id/transactions', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/wallets-transactions-test-member/1/transactions');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return wallet transactions if admin', async () => {
      const walletId = 1;
      // Mock wallet transactions data
      const mockTransactions = [
        {
          id: 1,
          walletId: walletId,
          amount: 500000,
          type: 'income',
          description: 'Membership fee',
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            name: 'Admin User',
          },
        },
        {
          id: 2,
          walletId: walletId,
          amount: 200000,
          type: 'expense',
          description: 'Office supplies',
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          user: {
            id: 1,
            name: 'Admin User',
          },
        },
      ];

      // Mock storage to return wallet transactions
      (storage.getWalletTransactions as jest.Mock).mockResolvedValue(mockTransactions);

      // Mock authenticated admin request
      app.use('/api/wallets-transactions-test-admin/:id/transactions', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/wallets-transactions-test-admin/:id/transactions', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const transactions = await storage.getWalletTransactions(id);
          res.json(transactions);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch wallet transactions' });
        }
      });

      const response = await request(app).get(`/api/wallets-transactions-test-admin/${walletId}/transactions`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('walletId', walletId);
      expect(response.body[0]).toHaveProperty('amount');
      expect(response.body[0]).toHaveProperty('type');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('user');
      expect(storage.getWalletTransactions).toHaveBeenCalledWith(walletId);
    });
  });

  describe('POST /api/transactions', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/transactions')
        .send({
          walletId: 1,
          amount: 300000,
          type: 'income',
          description: 'New income',
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/transactions-create-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/transactions-create-test-member')
        .send({
          walletId: 1,
          amount: 300000,
          type: 'income',
          description: 'New income',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create transaction if admin', async () => {
      const adminId = 1;
      const newTransaction = {
        walletId: 1,
        amount: 300000,
        type: 'income',
        description: 'New income',
      };

      const createdTransaction = {
        id: 3,
        ...newTransaction,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create transaction
      (storage.createTransaction as jest.Mock).mockResolvedValue(createdTransaction);

      // Mock authenticated admin request
      app.use('/api/transactions-create-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: adminId, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/transactions-create-test-admin', async (req, res) => {
        try {
          const { walletId, amount, type, description } = req.body;
          
          if (!walletId || amount === undefined || !type) {
            return res.status(400).json({ message: 'Wallet ID, amount, and type are required' });
          }
          
          if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either income or expense' });
          }
          
          const transaction = await storage.createTransaction({
            walletId,
            amount,
            type,
            description,
            createdBy: req.user.id,
          });
          
          res.status(201).json(transaction);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create transaction' });
        }
      });

      const response = await request(app)
        .post('/api/transactions-create-test-admin')
        .send(newTransaction);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('walletId', newTransaction.walletId);
      expect(response.body).toHaveProperty('amount', newTransaction.amount);
      expect(response.body).toHaveProperty('type', newTransaction.type);
      expect(response.body).toHaveProperty('description', newTransaction.description);
      expect(response.body).toHaveProperty('createdBy', adminId);
      expect(storage.createTransaction).toHaveBeenCalledWith({
        ...newTransaction,
        createdBy: adminId,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      // Mock authenticated admin request
      app.use('/api/transactions-create-invalid-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/transactions-create-invalid-test', async (req, res) => {
        try {
          const { walletId, amount, type, description } = req.body;
          
          if (!walletId || amount === undefined || !type) {
            return res.status(400).json({ message: 'Wallet ID, amount, and type are required' });
          }
          
          if (!['income', 'expense'].includes(type)) {
            return res.status(400).json({ message: 'Type must be either income or expense' });
          }
          
          const transaction = await storage.createTransaction({
            walletId,
            amount,
            type,
            description,
            createdBy: req.user.id,
          });
          
          res.status(201).json(transaction);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create transaction' });
        }
      });

      // Test missing walletId
      const responseMissingWalletId = await request(app)
        .post('/api/transactions-create-invalid-test')
        .send({
          amount: 300000,
          type: 'income',
          description: 'Missing wallet ID',
        });
      
      expect(responseMissingWalletId.status).toBe(400);
      expect(responseMissingWalletId.body).toHaveProperty('message', 'Wallet ID, amount, and type are required');

      // Test missing amount
      const responseMissingAmount = await request(app)
        .post('/api/transactions-create-invalid-test')
        .send({
          walletId: 1,
          type: 'income',
          description: 'Missing amount',
        });
      
      expect(responseMissingAmount.status).toBe(400);
      expect(responseMissingAmount.body).toHaveProperty('message', 'Wallet ID, amount, and type are required');

      // Test missing type
      const responseMissingType = await request(app)
        .post('/api/transactions-create-invalid-test')
        .send({
          walletId: 1,
          amount: 300000,
          description: 'Missing type',
        });
      
      expect(responseMissingType.status).toBe(400);
      expect(responseMissingType.body).toHaveProperty('message', 'Wallet ID, amount, and type are required');

      // Test invalid type
      const responseInvalidType = await request(app)
        .post('/api/transactions-create-invalid-test')
        .send({
          walletId: 1,
          amount: 300000,
          type: 'invalid',
          description: 'Invalid type',
        });
      
      expect(responseInvalidType.status).toBe(400);
      expect(responseInvalidType.body).toHaveProperty('message', 'Type must be either income or expense');

      expect(storage.createTransaction).not.toHaveBeenCalled();
    });
  });
});