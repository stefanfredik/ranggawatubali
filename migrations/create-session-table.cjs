require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSessionTable() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Creating session table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS "session" (
          "sid" varchar NOT NULL COLLATE "default",
          "sess" json NOT NULL,
          "expire" timestamp(6) NOT NULL,
          CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
        );

        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
      `);
      console.log('Session table created successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating session table:', err);
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
      console.log('Database connection closed');
    } catch (endError) {
      console.error('Error closing database connection:', endError.message);
    }
  }
}

createSessionTable();