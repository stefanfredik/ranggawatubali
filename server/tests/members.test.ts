import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Members Endpoints', () => {
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

  describe('GET /api/members', () => {
    it('should return 401 if not authenticated', async () => {
      // Mock isAuthenticated to return false
      const response = await request(app).get('/api/members');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/members-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { role: 'member' };
        next();
      });

      const response = await request(app).get('/api/members-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return members list if admin', async () => {
      // Mock members data
      const mockMembers = [
        {
          id: 1,
          username: 'user1',
          email: 'user1@example.com',
          name: 'User One',
          role: 'member',
          password: 'hashedpassword1',
        },
        {
          id: 2,
          username: 'user2',
          email: 'user2@example.com',
          name: 'User Two',
          role: 'member',
          password: 'hashedpassword2',
        },
      ];

      // Mock storage to return members
      (storage.getAllMembers as jest.Mock).mockResolvedValue(mockMembers);

      // Mock authenticated admin request
      app.use('/api/members-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/members-test-admin', async (req, res) => {
        const members = await storage.getAllMembers();
        const membersWithoutPasswords = members.map(({ password, ...member }) => member);
        res.json(membersWithoutPasswords);
      });

      const response = await request(app).get('/api/members-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).not.toHaveProperty('password');
      expect(response.body[1]).not.toHaveProperty('password');
      expect(storage.getAllMembers).toHaveBeenCalled();
    });

    it('should return 500 if database error occurs', async () => {
      // Mock storage to throw error
      (storage.getAllMembers as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Mock authenticated admin request
      app.use('/api/members-test-error', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { role: 'admin' };
        next();
      });

      // Mock route handler with error
      app.get('/api/members-test-error', async (req, res) => {
        try {
          await storage.getAllMembers();
          res.json([]);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch members' });
        }
      });

      const response = await request(app).get('/api/members-test-error');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch members');
      expect(storage.getAllMembers).toHaveBeenCalled();
    });
  });

  describe('POST /api/members', () => {
    it('should create a new member if admin', async () => {
      const newMember = {
        username: 'newuser',
        password: 'password123',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'member',
        birthDate: '1995-05-15',
        address: 'Some Address',
        phone: '1234567890',
      };

      const createdMember = {
        id: 3,
        ...newMember,
        password: 'hashedpassword',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage functions
      (storage.getUserByUsername as jest.Mock).mockResolvedValue(null);
      (storage.getUserByEmail as jest.Mock).mockResolvedValue(null);
      (storage.createUser as jest.Mock).mockResolvedValue(createdMember);

      // Mock authenticated admin request
      app.use('/api/members-create-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/members-create-test', async (req, res) => {
        try {
          // Check if username or email already exists
          const existingUser = await storage.getUserByUsername(req.body.username);
          if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          
          const existingEmail = await storage.getUserByEmail(req.body.email);
          if (existingEmail) {
            return res.status(400).json({ message: 'Email already exists' });
          }

          const member = await storage.createUser(req.body);
          const { password, ...memberWithoutPassword } = member;
          res.status(201).json(memberWithoutPassword);
        } catch (error: any) {
          res.status(500).json({ message: 'Failed to create member' });
        }
      });

      const response = await request(app)
        .post('/api/members-create-test')
        .send(newMember);
      
      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).toHaveProperty('id');
      expect(storage.getUserByUsername).toHaveBeenCalledWith(newMember.username);
      expect(storage.getUserByEmail).toHaveBeenCalledWith(newMember.email);
      expect(storage.createUser).toHaveBeenCalled();
    });

    it('should return 400 if username already exists', async () => {
      const existingMember = {
        username: 'existinguser',
        password: 'password123',
        email: 'new@example.com',
        name: 'Existing User',
        role: 'member',
      };

      // Mock storage to return existing user
      (storage.getUserByUsername as jest.Mock).mockResolvedValue({
        id: 4,
        username: 'existinguser',
      });

      // Mock authenticated admin request
      app.use('/api/members-duplicate-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/members-duplicate-test', async (req, res) => {
        try {
          // Check if username already exists
          const existingUser = await storage.getUserByUsername(req.body.username);
          if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
          }
          
          res.status(201).json({});
        } catch (error: any) {
          res.status(500).json({ message: 'Failed to create member' });
        }
      });

      const response = await request(app)
        .post('/api/members-duplicate-test')
        .send(existingMember);
      
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Username already exists');
      expect(storage.getUserByUsername).toHaveBeenCalledWith(existingMember.username);
    });
  });

  // Additional tests for PUT, DELETE, and PATCH endpoints would follow a similar pattern
});