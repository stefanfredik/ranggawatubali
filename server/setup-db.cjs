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

async function setupAllTables() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    try {
      // Define the order of migrations (order matters for dependencies)
      const migrationFiles = [
        'create_session_table.sql',
        'create_donations_table.sql'
      ];
      
      // Execute each migration in sequence
      for (const file of migrationFiles) {
        console.log(`Setting up using ${file}...`);
        const sqlFilePath = path.join(__dirname, '..', 'migrations', file);
        const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');
        await client.query(sqlQuery);
        console.log(`Setup using ${file} completed successfully`);
      }
      
      console.log('All tables set up successfully');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error setting up tables:', err);
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupAllTables();