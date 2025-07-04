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

async function rollbackAllTables() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      // Define the order of rollbacks (reverse order of creation)
      const rollbackFiles = [
        'rollback_campus_column.sql',
        'rollback_donations_table.sql',
        'rollback_session_table.sql'
      ];
      
      // Execute each rollback in sequence
      for (const file of rollbackFiles) {
        console.log(`Rolling back using ${file}...`);
        const sqlFilePath = path.join(__dirname, file);
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        await client.query(sqlQuery);
        console.log(`Rollback using ${file} completed successfully`);
      }
      
      console.log('All tables rolled back successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error rolling back tables:', err);
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

rollbackAllTables();