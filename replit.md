# Replit.md - Rangga Watu Bali Organization Management System

## Overview

This is a full-stack organization management system built for "Rangga Watu Bali" using a modern tech stack. The application provides comprehensive management features for members, activities, announcements, and payments with role-based access control.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Shadcn/UI components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom glassmorphism design system
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and session-based auth
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **API Design**: RESTful endpoints with role-based middleware

### Database Architecture
- **Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle ORM with TypeScript-first schema definitions
- **Schema Location**: Shared between client and server in `/shared/schema.ts`
- **Migration Strategy**: Drizzle Kit for schema management

## Key Components

### Authentication System
- Session-based authentication using Passport.js
- Password hashing with Node.js crypto (scrypt)
- Role-based access control (admin/member)
- Protected routes with authentication middleware
- Session persistence with PostgreSQL store

### Database Schema
Core entities include:
- **Users**: Member management with roles, status, and profile information
- **Announcements**: Organization-wide communications with type categorization
- **Activities**: Event management with participant tracking
- **Payments**: Financial transaction processing with approval workflow
- **Activity Participants**: Many-to-many relationship for event attendance

### UI/UX Design
- Glassmorphism design system with CSS custom properties
- Dark/light theme support with system preference detection
- Responsive design optimized for mobile and desktop
- Accessible components using Radix UI primitives
- Consistent spacing and typography through design tokens

## Data Flow

### Client-Server Communication
1. Client makes API requests through TanStack Query
2. Express.js middleware handles authentication and validation
3. Drizzle ORM manages database interactions
4. Responses cached and managed by React Query

### Authentication Flow
1. User submits credentials via login form
2. Passport.js validates against PostgreSQL user store
3. Session created and stored in PostgreSQL
4. Subsequent requests authenticated via session middleware
5. Role-based access enforced at route level

### State Management
- Server state managed by TanStack Query with automatic caching
- Form state handled by React Hook Form
- UI state (theme, navigation) managed by React Context
- Real-time updates through query invalidation

## External Dependencies

### Core Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: For Neon serverless connections

### Development Tools
- **Vite**: Build tool with HMR and optimized bundling
- **TypeScript**: Type safety across the entire stack
- **ESBuild**: Fast server-side bundling for production

### UI/Component Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Lucide React**: Icon library with consistent design
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

### Build Process
- **Client**: Vite builds optimized React bundle to `dist/public`
- **Server**: ESBuild bundles TypeScript server code to `dist/index.js`
- **Shared**: TypeScript compilation with path mapping for shared schema

### Production Configuration
- Environment-based configuration for database connections
- Secure session settings with proper cookie configuration
- Trust proxy settings for deployment behind reverse proxies
- Static file serving for production builds

### Database Management
- Schema changes managed through Drizzle migrations
- Database URL configuration via environment variables
- Connection pooling for serverless deployments

## Changelog

```
Changelog:
- June 28, 2025. Initial setup with complete organizational management system
- June 28, 2025. Added admin user (admin@example.com / 12345) and sample members
- June 28, 2025. Implemented glassmorphism design with dark/light theme support
- June 28, 2025. Database seeded with test data for demonstration
- June 28, 2025. Added complete member management with CRUD operations
- June 28, 2025. Implemented environment configuration system for flexible database setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```