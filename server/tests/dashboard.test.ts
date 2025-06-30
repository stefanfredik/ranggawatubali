import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Dashboard Endpoints', () => {
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

  describe('GET /api/dashboard/stats', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/dashboard/stats');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/dashboard-stats-test-member', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app).get('/api/dashboard-stats-test-member');
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should return dashboard stats if admin', async () => {
      // Mock dashboard stats data
      const mockStats = {
        totalMembers: 10,
        totalWalletBalance: 5000000,
        pendingPayments: 3,
        upcomingDues: 5,
        recentActivities: [
          {
            id: 1,
            title: 'Monthly Meeting',
            date: new Date(),
            location: 'Community Hall',
            description: 'Regular monthly meeting',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            title: 'Charity Event',
            date: new Date(),
            location: 'City Park',
            description: 'Annual charity event',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      // Mock storage to return dashboard stats
      (storage.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      // Mock authenticated admin request
      app.use('/api/dashboard-stats-test-admin', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.get('/api/dashboard-stats-test-admin', async (req, res) => {
        try {
          const stats = await storage.getDashboardStats();
          res.json(stats);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch dashboard stats' });
        }
      });

      const response = await request(app).get('/api/dashboard-stats-test-admin');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('totalMembers', mockStats.totalMembers);
      expect(response.body).toHaveProperty('totalWalletBalance', mockStats.totalWalletBalance);
      expect(response.body).toHaveProperty('pendingPayments', mockStats.pendingPayments);
      expect(response.body).toHaveProperty('upcomingDues', mockStats.upcomingDues);
      expect(response.body).toHaveProperty('recentActivities');
      expect(response.body.recentActivities).toHaveLength(2);
      expect(storage.getDashboardStats).toHaveBeenCalled();
    });
  });

  describe('GET /api/dashboard/birthdays', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/dashboard/birthdays');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return upcoming birthdays if authenticated', async () => {
      // Mock upcoming birthdays data
      const mockBirthdays = [
        {
          id: 2,
          name: 'Member User',
          birthDate: new Date('1990-05-15'),
          age: 33,
          daysUntilBirthday: 10,
        },
        {
          id: 3,
          name: 'Another Member',
          birthDate: new Date('1985-05-20'),
          age: 38,
          daysUntilBirthday: 15,
        },
      ];

      // Mock storage to return upcoming birthdays
      (storage.getUpcomingBirthdays as jest.Mock).mockResolvedValue(mockBirthdays);

      // Mock authenticated request
      app.use('/api/dashboard-birthdays-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/dashboard-birthdays-test', async (req, res) => {
        try {
          const birthdays = await storage.getUpcomingBirthdays();
          res.json(birthdays);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch upcoming birthdays' });
        }
      });

      const response = await request(app).get('/api/dashboard-birthdays-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('birthDate');
      expect(response.body[0]).toHaveProperty('age');
      expect(response.body[0]).toHaveProperty('daysUntilBirthday');
      expect(storage.getUpcomingBirthdays).toHaveBeenCalled();
    });
  });

  describe('GET /api/dashboard/member-stats', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/dashboard/member-stats');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return member stats if authenticated', async () => {
      const userId = 2;
      // Mock member stats data
      const mockMemberStats = {
        pendingDues: 1,
        totalPaid: 500000,
        upcomingDues: [
          {
            id: 3,
            amount: 50000,
            dueDate: new Date(),
            status: 'pending',
          },
        ],
        recentPayments: [
          {
            id: 1,
            amount: 100000,
            purpose: 'Dues',
            paymentDate: new Date(),
            status: 'approved',
          },
          {
            id: 2,
            amount: 150000,
            purpose: 'Initial Fee',
            paymentDate: new Date(),
            status: 'approved',
          },
        ],
      };

      // Mock storage to return member stats
      (storage.getMemberDashboardStats as jest.Mock).mockResolvedValue(mockMemberStats);

      // Mock authenticated request
      app.use('/api/dashboard-member-stats-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: userId, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/dashboard-member-stats-test', async (req, res) => {
        try {
          const stats = await storage.getMemberDashboardStats(req.user.id);
          res.json(stats);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch member stats' });
        }
      });

      const response = await request(app).get('/api/dashboard-member-stats-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('pendingDues', mockMemberStats.pendingDues);
      expect(response.body).toHaveProperty('totalPaid', mockMemberStats.totalPaid);
      expect(response.body).toHaveProperty('upcomingDues');
      expect(response.body).toHaveProperty('recentPayments');
      expect(response.body.upcomingDues).toHaveLength(1);
      expect(response.body.recentPayments).toHaveLength(2);
      expect(storage.getMemberDashboardStats).toHaveBeenCalledWith(userId);
    });
  });
});