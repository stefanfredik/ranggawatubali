import 'dotenv/config';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { Pool } from "@neondatabase/serverless";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function seedAdmin() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    const hashedPassword = await hashPassword("12345");
    
    const result = await pool.query(`
      INSERT INTO users (username, email, password, full_name, role, status, join_date) 
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE) 
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        status = EXCLUDED.status
      RETURNING id, email, full_name, role;
    `, ['admin', 'admin@example.com', hashedPassword, 'Administrator', 'admin', 'active']);
    
    console.log('Admin user created/updated:', result.rows[0]);
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

seedAdmin();