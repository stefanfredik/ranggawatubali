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

async function createDonationTable() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Creating donation tables...');
      
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'create-donation-table.sql');
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Execute the SQL
      await client.query(sql);
      
      console.log('Donation tables created successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating donation tables:', error);
    console.error('Error details:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
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

createDonationTable();