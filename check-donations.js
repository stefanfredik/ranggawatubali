const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
require('dotenv').config();

async function main() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Querying donations table...');
    const result = await sql`SELECT * FROM donations LIMIT 5`;
    console.log('Donations:', result);
    
    console.log('Querying users table...');
    const users = await sql`SELECT * FROM users LIMIT 5`;
    console.log('Users:', users);
  } catch (error) {
    console.error('Error:', error);
  }
}

main();