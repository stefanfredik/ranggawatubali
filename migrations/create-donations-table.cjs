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
        CREATE TABLE IF NOT EXISTS "donations" (
          "id" serial PRIMARY KEY,
          "user_id" integer NOT NULL REFERENCES "users"("id"),
          "amount" decimal(15, 2) NOT NULL,
          "event_name" text NOT NULL,
          "event_date" date NOT NULL,
          "target_amount" decimal(15, 2),
          "status" text NOT NULL DEFAULT 'pending',
          "collection_date" date,
          "collection_method" text,
          "wallet_id" integer REFERENCES "wallets"("id"),
          "notes" text,
          "type" text NOT NULL,
          "created_at" timestamp NOT NULL DEFAULT now(),
          "updated_at" timestamp NOT NULL DEFAULT now()
        );
      `);
      console.log('Donations table created successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating donations table:', err);
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