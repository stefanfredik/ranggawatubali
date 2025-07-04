require('dotenv').config();
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration: Adding profilePicture column to users table');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Add profilePicture column to users table
    await client.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "profile_picture" text;
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();