import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  try {
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Checking if donations table exists...');
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log('Tables in database:', tables.map(t => t.table_name));
    
    const hasDonationsTable = tables.some(t => t.table_name === 'donations');
    
    if (hasDonationsTable) {
      console.log('Querying donations table...');
      const result = await sql`SELECT * FROM donations LIMIT 5`;
      console.log('Donations count:', result.length);
      console.log('Donations:', result);
    } else {
      console.log('Donations table does not exist!');
    }
    
    console.log('\nChecking users with admin role...');
    const adminUsers = await sql`SELECT * FROM users WHERE role = 'admin'`;
    console.log('Admin users count:', adminUsers.length);
    console.log('Admin users:', adminUsers.map(u => ({ id: u.id, username: u.username, email: u.email, role: u.role })));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();