console.log('Starting setup-all.js script...');
require('dotenv').config();
console.log('Loaded environment variables');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configure Neon to use WebSockets
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Helper function to run a command
function runCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Running command: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`Command stderr: ${stderr}`);
      }
      console.log(`Command stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

async function setupDatabase() {
  try {
    console.log('=== Starting Database Setup ===');
    
    // Step 1: Run existing migration scripts
    console.log('\n=== Step 1: Running Migration Scripts ===');
    
    // Define the migration scripts to run in order
    const migrationScripts = [
      path.join(__dirname, '..', 'migrations', 'create-session-table.cjs'),
      path.join(__dirname, '..', 'migrations', 'create-donations-table.cjs')
    ];
    
    for (const script of migrationScripts) {
      try {
        console.log(`Running migration script: ${script}`);
        await runCommand(`node "${script}"`);
        console.log(`Successfully ran migration script: ${script}`);
      } catch (err) {
        console.error(`Error running migration script ${script}:`, err);
        console.error('Continuing with next migration...');
      }
    }
    
    // Step 2: Check if tables were created successfully
    console.log('\n=== Step 2: Verifying Database Tables ===');
    const client = await pool.connect();
    try {
      // Check if session table exists
      const sessionTableResult = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'session')"
      );
      const sessionTableExists = sessionTableResult.rows[0].exists;
      console.log(`Session table exists: ${sessionTableExists}`);
      
      // Check if donations table exists
      const donationsTableResult = await client.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'donations')"
      );
      const donationsTableExists = donationsTableResult.rows[0].exists;
      console.log(`Donations table exists: ${donationsTableExists}`);
      
      // If any table doesn't exist, create it manually
      if (!sessionTableExists) {
        console.log('Creating session table manually...');
        const sessionSqlPath = path.join(__dirname, '..', 'migrations', 'create_session_table.sql');
        const sessionSql = fs.readFileSync(sessionSqlPath, 'utf8');
        await client.query(sessionSql);
        console.log('Session table created manually');
      }
      
      if (!donationsTableExists) {
        console.log('Creating donations table manually...');
        const donationsSqlPath = path.join(__dirname, '..', 'migrations', 'create_donations_table.sql');
        const donationsSql = fs.readFileSync(donationsSqlPath, 'utf8');
        await client.query(donationsSql);
        console.log('Donations table created manually');
      }
    } finally {
      client.release();
    }
    
    // Step 3: Run seed script if it exists
    console.log('\n=== Step 3: Running Seed Scripts ===');
    const seedAdminPath = path.join(__dirname, 'seed-admin.js');
    
    if (fs.existsSync(seedAdminPath)) {
      try {
        console.log('Running seed-admin.js script...');
        await runCommand(`node "${seedAdminPath}"`);
        console.log('Successfully ran seed-admin.js');
      } catch (err) {
        console.error('Error running seed-admin.js:', err);
      }
    } else {
      console.log('No seed-admin.js script found. Skipping this step.');
    }
    
    console.log('\n=== Database Setup Completed Successfully ===');
  } catch (err) {
    console.error('Error during database setup:', err);
    console.error('Error details:', err.message);
    if (err.code) {
      console.error('Error code:', err.code);
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();