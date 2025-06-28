import { config } from 'dotenv';

// Load environment variables
config();

export const appConfig = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/rangga_watu_bali',
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'rangga_watu_bali',
  },

  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '5000'),
    nodeEnv: process.env.NODE_ENV || 'development',
    allowedHosts: process.env.ALLOWED_HOSTS?.split(',') || ['localhost'],
  },

  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-super-secret-session-key-change-this-in-production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Upload configuration (for future features)
  upload: {
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880'), // 5MB default
    allowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf'
    ],
  },

  // Email configuration (for future features)
  email: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASS || '',
  },
};

// Validate required environment variables
export function validateConfig() {
  const requiredVars = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}`);
    console.warn('📝 Please copy .env.example to .env and configure the missing variables');
  }
  
  if (appConfig.session.secret === 'your-super-secret-session-key-change-this-in-production') {
    console.warn('⚠️  Using default session secret. Please change SESSION_SECRET in production!');
  }
}