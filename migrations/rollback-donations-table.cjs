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

async function rollbackDonationsTable() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Rolling back donations table...');
      
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'rollback_donations_table.sql');
      const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Execute the SQL query
      await client.query(sqlQuery);
      
      console.log('Donations table rolled back successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error rolling back donations table:', err);
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rollbackDonationsTable();