
import 'dotenv/config';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import pkg from 'pg';
const { Client } = pkg;

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const hashedPassword = await hashPassword("12345");
    
    // Check if admin exists
    const existingAdmin = await client.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@example.com']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists:', existingAdmin.rows[0]);
      return;
    }

    // Create admin user
    const result = await client.query(`
      INSERT INTO users (username, email, password, full_name, role, status, join_date) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) 
      RETURNING id, email, full_name, role;
    `, ['admin', 'admin@example.com', hashedPassword, 'Administrator', 'admin', 'active']);
    
    console.log('Admin user created successfully:', result.rows[0]);
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.end();
  }
}

createAdmin();
