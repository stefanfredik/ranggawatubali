
```javascript
import 'dotenv/config';
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { db } from "./db.ts";
import { users } from "../shared/schema.ts";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

async function seedAdmin() {
  try {
    const hashedPassword = await hashPassword("12345");
    
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@example.com'));
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists:', existingAdmin[0]);
      return;
    }
    
    // Create admin user
    const [newAdmin] = await db.insert(users).values({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Administrator',
      role: 'admin',
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    }).returning();
    
    console.log('Admin user created successfully:', {
      id: newAdmin.id,
      email: newAdmin.email,
      fullName: newAdmin.fullName,
      role: newAdmin.role
    });
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

seedAdmin();
```
