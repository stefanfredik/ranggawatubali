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

async function createDonationsTable() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Creating donations table...');
      await client.query(`
        -- Create donations table
        CREATE TABLE IF NOT EXISTS "donations" (
          "id" SERIAL PRIMARY KEY,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "type" TEXT NOT NULL CHECK ("type" IN ('happy', 'sad', 'fundraising')),
          "amount" DECIMAL(15, 2) NOT NULL DEFAULT 0,
          "target_amount" DECIMAL(15, 2),
          "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'cancelled')),
          "created_by" INTEGER REFERENCES "users"("id") NOT NULL,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
          "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Create donation_contributors table
        CREATE TABLE IF NOT EXISTS "donation_contributors" (
          "id" SERIAL PRIMARY KEY,
          "donation_id" INTEGER REFERENCES "donations"("id") ON DELETE CASCADE NOT NULL,
          "user_id" INTEGER REFERENCES "users"("id") NOT NULL,
          "name" TEXT NOT NULL,
          "amount" DECIMAL(15, 2) NOT NULL,
          "message" TEXT,
          "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS "idx_donations_type" ON "donations"("type");
        CREATE INDEX IF NOT EXISTS "idx_donations_status" ON "donations"("status");
        CREATE INDEX IF NOT EXISTS "idx_donation_contributors_donation_id" ON "donation_contributors"("donation_id");
        CREATE INDEX IF NOT EXISTS "idx_donation_contributors_user_id" ON "donation_contributors"("user_id");
      `);
      console.log('Donations tables created successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating donations tables:', err);
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

createDonationsTable();