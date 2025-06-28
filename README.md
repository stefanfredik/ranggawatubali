# Rangga Watu Bali - Organization Management System

A modern web application for managing organizational data with role-based access control, built with React, Express, and PostgreSQL.

## Quick Start

1. Copy environment configuration:
   ```bash
   cp .env.example .env
   ```

2. Configure your database and session settings in `.env`

3. Install dependencies and start the application:
   ```bash
   npm install
   npm run dev
   ```

## Environment Configuration

### Required Variables

- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret key for session encryption (change in production)

### Optional Variables

- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment mode (development/production)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts

### Database Configuration Options

You can configure the database connection in two ways:

#### Option 1: Using DATABASE_URL (Recommended)
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### Option 2: Using individual PostgreSQL variables
```env
PGHOST=localhost
PGPORT=5432
PGUSER=username
PGPASSWORD=password
PGDATABASE=database_name
```

### Changing Database Providers

The application is configured to work with different PostgreSQL providers:

#### 1. Local PostgreSQL
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

#### 2. Neon (Serverless PostgreSQL)
```env
DATABASE_URL=postgresql://username:password@ep-example.us-east-1.neon.tech/database_name?sslmode=require
```

#### 3. Supabase
```env
DATABASE_URL=postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres
```

#### 4. Railway
```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-1.railway.app:5432/railway
```

#### 5. PlanetScale (with MySQL adapter - requires code changes)
```env
DATABASE_URL=mysql://username:password@gateway.planetscale.dev:3306/database_name?sslmode=require
```

## Production Deployment

### Environment Variables for Production

```env
NODE_ENV=production
SESSION_SECRET=your-very-secure-random-string-here
DATABASE_URL=your-production-database-url
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Security Considerations

1. **Always change the default SESSION_SECRET** in production
2. **Use HTTPS** in production (set `NODE_ENV=production`)
3. **Configure ALLOWED_HOSTS** to prevent host header attacks
4. **Use environment-specific database credentials**

## Database Schema Management

The application uses Drizzle ORM for database management:

```bash
# Push schema changes to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# Open database studio
npm run db:studio
```

## Features

- **Member Management**: Add, edit, delete members with role-based access
- **Dashboard**: Statistics and overview of organizational data
- **Authentication**: Secure login with session management
- **Responsive Design**: Works on desktop and mobile devices
- **Glassmorphism UI**: Modern, clean interface design

## Default Admin Account

- **Email**: admin@example.com
- **Password**: 12345

*Change this immediately in production*

## Technology Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Shadcn/UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with sessions
- **Build**: Vite for development and production

## Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── .env.example     # Environment template
├── .env             # Your local configuration
└── README.md        # This file
```

## Support

For issues or questions, refer to the project documentation or create an issue in the repository.