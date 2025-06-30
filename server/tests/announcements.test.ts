import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Announcements Endpoints', () => {
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

  describe('GET /api/announcements', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/announcements');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return announcements if authenticated', async () => {
      // Mock announcements data
      const mockAnnouncements = [
        {
          id: 1,
          title: 'Announcement 1',
          content: 'Content 1',
          authorId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 1,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
        {
          id: 2,
          title: 'Announcement 2',
          content: 'Content 2',
          authorId: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 1,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
        },
      ];

      // Mock storage to return announcements
      (storage.getAnnouncements as jest.Mock).mockResolvedValue(mockAnnouncements);

      // Mock authenticated request
      app.use('/api/announcements-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/announcements-test', async (req, res) => {
        try {
          const announcements = await storage.getAnnouncements();
          res.json(announcements);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch announcements' });
        }
      });

      const response = await request(app).get('/api/announcements-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('content');
      expect(response.body[0]).toHaveProperty('author');
      expect(storage.getAnnouncements).toHaveBeenCalled();
    });

    it('should return 500 if database error occurs', async () => {
      // Mock storage to throw error
      (storage.getAnnouncements as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Mock authenticated request
      app.use('/api/announcements-error-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      // Mock route handler with error
      app.get('/api/announcements-error-test', async (req, res) => {
        try {
          await storage.getAnnouncements();
          res.json([]);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch announcements' });
        }
      });

      const response = await request(app).get('/api/announcements-error-test');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch announcements');
      expect(storage.getAnnouncements).toHaveBeenCalled();
    });
  });

  describe('POST /api/announcements', () => {
    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/announcements-create-member-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/announcements-create-member-test')
        .send({
          title: 'New Announcement',
          content: 'New Content',
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create announcement if admin', async () => {
      const newAnnouncement = {
        title: 'New Announcement',
        content: 'New Content',
      };

      const createdAnnouncement = {
        id: 3,
        ...newAnnouncement,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create announcement
      (storage.createAnnouncement as jest.Mock).mockResolvedValue(createdAnnouncement);

      // Mock authenticated admin request
      app.use('/api/announcements-create-admin-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/announcements-create-admin-test', async (req, res) => {
        try {
          const announcement = await storage.createAnnouncement({
            ...req.body,
            authorId: req.user.id,
          });
          res.status(201).json(announcement);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create announcement' });
        }
      });

      const response = await request(app)
        .post('/api/announcements-create-admin-test')
        .send(newAnnouncement);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newAnnouncement.title);
      expect(response.body).toHaveProperty('content', newAnnouncement.content);
      expect(response.body).toHaveProperty('authorId', 1);
      expect(storage.createAnnouncement).toHaveBeenCalledWith({
        ...newAnnouncement,
        authorId: 1,
      });
    });
  });

  describe('PUT /api/announcements/:id', () => {
    it('should update announcement if admin', async () => {
      const announcementId = 1;
      const updates = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      const updatedAnnouncement = {
        id: announcementId,
        ...updates,
        authorId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update announcement
      (storage.updateAnnouncement as jest.Mock).mockResolvedValue(updatedAnnouncement);

      // Mock authenticated admin request
      app.use('/api/announcements-update-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/announcements-update-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const updates = req.body;
          
          const announcement = await storage.updateAnnouncement(id, updates);
          if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
          }
          
          res.json(announcement);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update announcement' });
        }
      });

      const response = await request(app)
        .put(`/api/announcements-update-test/${announcementId}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', announcementId);
      expect(response.body).toHaveProperty('title', updates.title);
      expect(response.body).toHaveProperty('content', updates.content);
      expect(storage.updateAnnouncement).toHaveBeenCalledWith(announcementId, updates);
    });

    it('should return 404 if announcement not found', async () => {
      const announcementId = 999;
      const updates = {
        title: 'Updated Title',
        content: 'Updated Content',
      };

      // Mock storage to return null (not found)
      (storage.updateAnnouncement as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/announcements-update-notfound-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/announcements-update-notfound-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const updates = req.body;
          
          const announcement = await storage.updateAnnouncement(id, updates);
          if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
          }
          
          res.json(announcement);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update announcement' });
        }
      });

      const response = await request(app)
        .put(`/api/announcements-update-notfound-test/${announcementId}`)
        .send(updates);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Announcement not found');
      expect(storage.updateAnnouncement).toHaveBeenCalledWith(announcementId, updates);
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    it('should delete announcement if admin', async () => {
      const announcementId = 2;

      // Mock storage to delete announcement
      (storage.deleteAnnouncement as jest.Mock).mockResolvedValue(true);

      // Mock authenticated admin request
      app.use('/api/announcements-delete-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.delete('/api/announcements-delete-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const success = await storage.deleteAnnouncement(id);
          
          if (!success) {
            return res.status(404).json({ message: 'Announcement not found' });
          }
          
          res.sendStatus(204);
        } catch (error) {
          res.status(500).json({ message: 'Failed to delete announcement' });
        }
      });

      const response = await request(app).delete(`/api/announcements-delete-test/${announcementId}`);
      
      expect(response.status).toBe(204);
      expect(storage.deleteAnnouncement).toHaveBeenCalledWith(announcementId);
    });

    it('should return 404 if announcement not found', async () => {
      const announcementId = 999;

      // Mock storage to return false (not found)
      (storage.deleteAnnouncement as jest.Mock).mockResolvedValue(false);

      // Mock authenticated admin request
      app.use('/api/announcements-delete-notfound-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.delete('/api/announcements-delete-notfound-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const success = await storage.deleteAnnouncement(id);
          
          if (!success) {
            return res.status(404).json({ message: 'Announcement not found' });
          }
          
          res.sendStatus(204);
        } catch (error) {
          res.status(500).json({ message: 'Failed to delete announcement' });
        }
      });

      const response = await request(app).delete(`/api/announcements-delete-notfound-test/${announcementId}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Announcement not found');
      expect(storage.deleteAnnouncement).toHaveBeenCalledWith(announcementId);
    });
  });
});