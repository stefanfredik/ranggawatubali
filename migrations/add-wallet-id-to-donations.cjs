const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Run the migration to add wallet_id column to donations table
 */
async function runMigration() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Starting migration: Adding wallet_id column to donations table');
    
    // Check if the column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'donations' AND column_name = 'wallet_id';
    `;
    
    const columnCheckResult = await client.query(checkColumnQuery);
    
    if (columnCheckResult.rows.length === 0) {
      // Column doesn't exist, add it
      const addColumnQuery = `
        ALTER TABLE donations 
        ADD COLUMN wallet_id INTEGER REFERENCES wallets(id);
      `;
      
      await client.query(addColumnQuery);
      console.log('Added wallet_id column to donations table');
    } else {
      console.log('wallet_id column already exists in donations table');
    }
    
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run the migration
runMigration();