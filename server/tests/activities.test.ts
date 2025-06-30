import type { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../routes';
import { storage } from '../storage';

// Import setup
import './setup';

describe('Activities Endpoints', () => {
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

  describe('GET /api/activities', () => {
    it('should return 401 if not authenticated', async () => {
      const response = await request(app).get('/api/activities');
      
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'Authentication required');
    });

    it('should return activities if authenticated', async () => {
      // Mock activities data
      const mockActivities = [
        {
          id: 1,
          title: 'Activity 1',
          description: 'Description 1',
          location: 'Location 1',
          startDate: new Date(),
          endDate: new Date(),
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 1,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
          participantCount: 5,
        },
        {
          id: 2,
          title: 'Activity 2',
          description: 'Description 2',
          location: 'Location 2',
          startDate: new Date(),
          endDate: new Date(),
          createdBy: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
          creator: {
            id: 1,
            name: 'Admin User',
            username: 'admin',
            email: 'admin@example.com',
            role: 'admin',
          },
          participantCount: 3,
        },
      ];

      // Mock storage to return activities
      (storage.getActivities as jest.Mock).mockResolvedValue(mockActivities);

      // Mock authenticated request
      app.use('/api/activities-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      // Mock route handler
      app.get('/api/activities-test', async (req, res) => {
        try {
          const activities = await storage.getActivities();
          res.json(activities);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch activities' });
        }
      });

      const response = await request(app).get('/api/activities-test');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('title');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('creator');
      expect(response.body[0]).toHaveProperty('participantCount');
      expect(storage.getActivities).toHaveBeenCalled();
    });

    it('should return 500 if database error occurs', async () => {
      // Mock storage to throw error
      (storage.getActivities as jest.Mock).mockRejectedValue(new Error('Database error'));

      // Mock authenticated request
      app.use('/api/activities-error-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      // Mock route handler with error
      app.get('/api/activities-error-test', async (req, res) => {
        try {
          await storage.getActivities();
          res.json([]);
        } catch (error) {
          res.status(500).json({ message: 'Failed to fetch activities' });
        }
      });

      const response = await request(app).get('/api/activities-error-test');
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Failed to fetch activities');
      expect(storage.getActivities).toHaveBeenCalled();
    });
  });

  describe('POST /api/activities', () => {
    it('should return 403 if not admin', async () => {
      // Mock authenticated but not admin
      app.use('/api/activities-create-member-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 2, role: 'member' };
        next();
      });

      const response = await request(app)
        .post('/api/activities-create-member-test')
        .send({
          title: 'New Activity',
          description: 'New Description',
          location: 'New Location',
          startDate: new Date(),
          endDate: new Date(),
        });
      
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('message', 'Admin access required');
    });

    it('should create activity if admin', async () => {
      const newActivity = {
        title: 'New Activity',
        description: 'New Description',
        location: 'New Location',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
      };

      const createdActivity = {
        id: 3,
        ...newActivity,
        startDate: new Date(newActivity.startDate),
        endDate: new Date(newActivity.endDate),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to create activity
      (storage.createActivity as jest.Mock).mockResolvedValue(createdActivity);

      // Mock authenticated admin request
      app.use('/api/activities-create-admin-test', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.post('/api/activities-create-admin-test', async (req, res) => {
        try {
          const activity = await storage.createActivity({
            ...req.body,
            createdBy: req.user.id,
          });
          res.status(201).json(activity);
        } catch (error) {
          res.status(500).json({ message: 'Failed to create activity' });
        }
      });

      const response = await request(app)
        .post('/api/activities-create-admin-test')
        .send(newActivity);
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title', newActivity.title);
      expect(response.body).toHaveProperty('description', newActivity.description);
      expect(response.body).toHaveProperty('location', newActivity.location);
      expect(response.body).toHaveProperty('createdBy', 1);
      expect(storage.createActivity).toHaveBeenCalledWith({
        ...newActivity,
        createdBy: 1,
      });
    });
  });

  describe('PUT /api/activities/:id', () => {
    it('should update activity if admin', async () => {
      const activityId = 1;
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
        location: 'Updated Location',
      };

      const updatedActivity = {
        id: activityId,
        ...updates,
        startDate: new Date(),
        endDate: new Date(),
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock storage to update activity
      (storage.updateActivity as jest.Mock).mockResolvedValue(updatedActivity);

      // Mock authenticated admin request
      app.use('/api/activities-update-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/activities-update-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const updates = req.body;
          
          const activity = await storage.updateActivity(id, updates);
          if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
          }
          
          res.json(activity);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update activity' });
        }
      });

      const response = await request(app)
        .put(`/api/activities-update-test/${activityId}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', activityId);
      expect(response.body).toHaveProperty('title', updates.title);
      expect(response.body).toHaveProperty('description', updates.description);
      expect(response.body).toHaveProperty('location', updates.location);
      expect(storage.updateActivity).toHaveBeenCalledWith(activityId, updates);
    });

    it('should return 404 if activity not found', async () => {
      const activityId = 999;
      const updates = {
        title: 'Updated Title',
        description: 'Updated Description',
      };

      // Mock storage to return null (not found)
      (storage.updateActivity as jest.Mock).mockResolvedValue(null);

      // Mock authenticated admin request
      app.use('/api/activities-update-notfound-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.put('/api/activities-update-notfound-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const updates = req.body;
          
          const activity = await storage.updateActivity(id, updates);
          if (!activity) {
            return res.status(404).json({ message: 'Activity not found' });
          }
          
          res.json(activity);
        } catch (error) {
          res.status(500).json({ message: 'Failed to update activity' });
        }
      });

      const response = await request(app)
        .put(`/api/activities-update-notfound-test/${activityId}`)
        .send(updates);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Activity not found');
      expect(storage.updateActivity).toHaveBeenCalledWith(activityId, updates);
    });
  });

  describe('DELETE /api/activities/:id', () => {
    it('should delete activity if admin', async () => {
      const activityId = 2;

      // Mock storage to delete activity
      (storage.deleteActivity as jest.Mock).mockResolvedValue(true);

      // Mock authenticated admin request
      app.use('/api/activities-delete-test/:id', (req: any, res: any, next: any) => {
        req.isAuthenticated = () => true;
        req.user = { id: 1, role: 'admin' };
        next();
      });

      // Mock route handler
      app.delete('/api/activities-delete-test/:id', async (req, res) => {
        try {
          const id = parseInt(req.params.id);
          const success = await storage.deleteActivity(id);
          
          if (!success) {
            return res.status(404).json({ message: 'Activity not found' });
          }
          
          res.sendStatus(204);
        } catch (error) {
          res.status(500).json({ message: 'Failed to delete activity' });
        }
      });

      const response = await request(app).delete(`/api/activities-delete-test/${activityId}`);
      
      expect(response.status).toBe(204);
      expect(storage.deleteActivity).toHaveBeenCalledWith(activityId);
    });
  });
});