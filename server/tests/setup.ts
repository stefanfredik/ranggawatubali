import { jest } from '@jest/globals';
import { db } from '../db';
import { pool } from '../db';

// Mock database connection
jest.mock('../db', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn(),
    desc: jest.fn(),
    and: jest.fn(),
    or: jest.fn(),
    count: jest.fn(),
    sql: jest.fn(),
  };

  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
    end: jest.fn(),
  };

  return {
    db: mockDb,
    pool: mockPool,
    eq: jest.fn(),
    desc: jest.fn(),
    and: jest.fn(),
    or: jest.fn(),
    count: jest.fn(),
    sql: jest.fn(),
  };
});

// Mock storage
jest.mock('../storage', () => {
  const mockStorage = {
    getUser: jest.fn(),
    getUserByUsername: jest.fn(),
    getUserByEmail: jest.fn(),
    createUser: jest.fn(),
    updateUser: jest.fn(),
    deleteUser: jest.fn(),
    getAllMembers: jest.fn(),
    getAnnouncements: jest.fn(),
    createAnnouncement: jest.fn(),
    updateAnnouncement: jest.fn(),
    deleteAnnouncement: jest.fn(),
    getActivities: jest.fn(),
    getActivity: jest.fn(),
    createActivity: jest.fn(),
    updateActivity: jest.fn(),
    deleteActivity: jest.fn(),
    joinActivity: jest.fn(),
    leaveActivity: jest.fn(),
    getPayments: jest.fn(),
    getUserPayments: jest.fn(),
    createPayment: jest.fn(),
    updatePaymentStatus: jest.fn(),
    getWallets: jest.fn(),
    getWallet: jest.fn(),
    createWallet: jest.fn(),
    updateWallet: jest.fn(),
    deleteWallet: jest.fn(),
    updateWalletBalance: jest.fn(),
    getTransactions: jest.fn(),
    getWalletTransactions: jest.fn(),
    createTransaction: jest.fn(),
    deleteTransaction: jest.fn(),
    getDues: jest.fn(),
    getUserDues: jest.fn(),
    createDues: jest.fn(),
    updateDuesStatus: jest.fn(),
    getInitialFees: jest.fn(),
    getUserInitialFee: jest.fn(),
    createInitialFee: jest.fn(),
    updateInitialFeeStatus: jest.fn(),
    getDashboardStats: jest.fn(),
    getUpcomingBirthdays: jest.fn(),
    sessionStore: {
      get: jest.fn(),
      set: jest.fn(),
      destroy: jest.fn(),
    },
  };

  return {
    storage: mockStorage,
    DatabaseStorage: jest.fn().mockImplementation(() => mockStorage),
  };
});

// Mock passport
jest.mock('passport', () => {
  return {
    authenticate: jest.fn().mockImplementation(() => {
      return (req: any, res: any, next: any) => next();
    }),
    initialize: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
    session: jest.fn().mockReturnValue((req: any, res: any, next: any) => next()),
    use: jest.fn(),
    serializeUser: jest.fn(),
    deserializeUser: jest.fn(),
  };
});

// Mock express-session
jest.mock('express-session', () => {
  return jest.fn().mockImplementation(() => {
    return (req: any, res: any, next: any) => {
      req.session = {
        id: 'test-session-id',
        destroy: jest.fn((cb) => cb && cb()),
        regenerate: jest.fn((cb) => cb && cb()),
        save: jest.fn((cb) => cb && cb()),
        cookie: {},
      };
      next();
    };
  });
});

// Setup and teardown
beforeAll(() => {
  // Global setup before all tests
});

afterAll(() => {
  // Global cleanup after all tests
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});