const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  // Create database connection
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Check if wallet_id column already exists in donation_contributors table
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'donation_contributors' AND column_name = 'wallet_id';
    `;
    
    const { rows } = await pool.query(checkColumnQuery);
    
    // If column doesn't exist, add it
    if (rows.length === 0) {
      console.log('Adding wallet_id column to donation_contributors table...');
      
      const addColumnQuery = `
        ALTER TABLE donation_contributors 
        ADD COLUMN wallet_id INTEGER REFERENCES wallets(id);
      `;
      
      await pool.query(addColumnQuery);
      console.log('Successfully added wallet_id column to donation_contributors table');
    } else {
      console.log('wallet_id column already exists in donation_contributors table');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

main();