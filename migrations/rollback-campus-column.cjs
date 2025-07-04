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

async function rollbackCampusColumn() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      console.log('Rolling back campus column from users table...');
      
      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'rollback_campus_column.sql');
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Execute the SQL
      await client.query(sql);
      
      console.log('Campus column rolled back successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error rolling back campus column:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rollbackCampusColumn();