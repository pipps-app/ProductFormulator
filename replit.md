# PIPPS Maker Calc - Replit Configuration

## Overview

PIPPS Maker Calc is a comprehensive SaaS formulation management platform designed for small businesses and manufacturers. The application enables users to manage raw materials, create product formulations, calculate costs and profit margins, and maintain vendor relationships through a subscription-based model.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack React Query for server state, React hooks for local state
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js 20 with Express.js
- **Database**: PostgreSQL 16 with Drizzle ORM
- **Authentication**: Passport.js with local and OAuth strategies
- **Session Management**: Express-session with memory store
- **File Handling**: Native file system operations for attachments
- **API Design**: RESTful endpoints with TypeScript validation

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Drizzle schema definitions
- **Fallback Storage**: File-based persistent storage for development
- **Session Storage**: In-memory store with automatic cleanup
- **File Attachments**: Local filesystem storage with size limits

## Key Components

### User Management
- Multi-tier subscription system (Free, Pro, Business, Enterprise)
- Local authentication with bcrypt password hashing
- Google OAuth integration (optional)
- Role-based access control (admin/user)

### Material Management
- Raw materials database with cost tracking
- Category organization with color coding
- Vendor relationship management
- File attachment support for specifications

### Formulation System
- Recipe creation with ingredient management
- Real-time cost calculations and profit margin analysis
- Batch sizing and unit conversions
- Include/exclude markup options for ingredients

### Subscription Enforcement
- Real-time usage tracking against plan limits
- Automatic limit enforcement on resource creation
- Upgrade prompts when limits are reached
- Payment integration with external processors

## Data Flow

### Authentication Flow
1. User login via email/password or OAuth
2. Session creation with user ID storage
3. Protected route middleware validates session
4. User data cached in React Query

### Material Management Flow
1. CRUD operations validated against subscription limits
2. Database operations through Drizzle ORM
3. Audit logging for all changes
4. Real-time UI updates via query invalidation

### Formulation Calculation Flow
1. Ingredient additions trigger cost recalculation
2. Backend calculates total costs and profit margins
3. Results stored in database and returned to frontend
4. Dashboard metrics updated automatically

## External Dependencies

### Payment Processing
- Shopify integration for secure payment processing
- Manual subscription activation workflow
- Admin interface for subscription management
- SQL-based user provisioning for verified payments

### Email Services
- Gmail SMTP integration for notifications
- Nodemailer for email sending functionality
- Password reset token management

### File Management
- Local filesystem for attachment storage
- MIME type validation and size limits
- Automatic cleanup on record deletion

### Development Tools
- Drizzle Kit for database migrations
- ESBuild for production bundling
- TypeScript compiler for type checking

## Deployment Strategy

### Environment Configuration
- Database connection via DATABASE_URL
- Optional PayPal credentials for payment processing
- Gmail credentials for email functionality
- Session secret for secure authentication

### Build Process
1. Frontend assets built with Vite
2. Backend bundled with ESBuild
3. Static files served from dist/public
4. Database schema applied automatically

### Production Setup
- PostgreSQL database required
- Node.js 20+ runtime environment
- Environment variables configured
- HTTPS recommended for security

### Scaling Considerations
- Session store can be upgraded to Redis
- File storage can be moved to cloud providers
- Database connection pooling configured
- Load balancer support for multiple instances

## Changelog

- June 24, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Subscription management: Manual activation preferred over automated webhooks for payment verification control.