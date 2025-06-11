# Pipps Maker Calc - Product Specification
**Version 1.0**  
**Date: June 2025**

## Executive Summary

Pipps Maker Calc is a comprehensive SaaS application designed for small to medium businesses in product formulation industries. The platform streamlines product development by providing intelligent cost calculation, profit margin analysis, and material management capabilities. Built with React/TypeScript frontend and Express/PostgreSQL backend, it offers real-time financial insights for formulation-based businesses.

---

## Core Features Overview

### 1. Dashboard & Analytics
- **Performance Metrics Display**: Real-time overview of business performance
- **Key Performance Indicators**:
  - Total Materials count
  - Active Formulations count  
  - Vendor relationships count
  - Average Profit Margin percentage
- **Formulation Performance Widget**: 
  - Total Target Revenue calculation
  - Average Profit Margin across all formulations
  - Total Production Cost summary
- **Recent Activity Feed**: Audit trail of system changes and updates
- **Materials Preview**: Quick view of recently added materials

### 2. Material Management System
- **Raw Materials Library**: Comprehensive material database
- **Material Properties**:
  - Name and SKU identification
  - Category classification with color coding
  - Vendor assignment and contact management
  - Unit cost tracking per material unit
  - Total quantity management
  - Total value calculations
  - Notes and documentation support
- **Advanced Search & Filtering**: Find materials by name, SKU, or category
- **Material Categories**: Organized classification system with color coding
- **File Attachments**: Support for material documentation and specifications

### 3. Formulation Development
- **Recipe Creation**: Build formulations with multiple ingredients
- **Ingredient Management**:
  - Material selection from library
  - Quantity specification with units
  - Cost contribution calculations
  - Include/exclude from markup options
- **Cost Calculations**:
  - Total material cost computation
  - Unit cost analysis
  - Profit margin calculations (% of selling price)
  - Markup calculations (% of cost)
- **Pricing Strategy**:
  - Target price setting
  - Suggested price recommendations
  - Profit analysis per unit
- **Formulation Status**: Active/inactive formulation management

### 4. Vendor & Supplier Management
- **Vendor Database**: Complete supplier information management
- **Contact Management**: Email and communication tracking
- **Vendor-Material Relationships**: Link materials to specific suppliers
- **Cost Tracking**: Monitor pricing changes from vendors

### 5. Financial Analysis & Reporting
- **Profit Margin Analysis**: Accurate profit calculations based on selling price
- **Cost Breakdown**: Detailed material cost contributions
- **Revenue Projections**: Target revenue calculations
- **Performance Tracking**: Historical analysis of formulation performance

### 6. User Management & Authentication
- **User Profiles**: Personal account management
- **Company Information**: Business details and settings
- **Role-Based Access**: Admin and user permissions
- **Password Management**: Secure authentication system

### 7. Subscription Management
- **Tiered Plans**: Free, Starter, Professional, and Unlimited options
- **Usage Limits**: 
  - Free: 5 materials, 2 formulations, 2 vendors
  - Starter: 50 materials, 25 formulations, 10 vendors
  - Professional: 500 materials, 250 formulations, 100 vendors
  - Unlimited: No restrictions
- **Shopify Integration**: Automated billing through Shopify store
- **Trial Accounts**: Instant trial creation for new users

---

## Technical Architecture

### Frontend Stack
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query for server state
- **UI Components**: Shadcn/ui component library
- **Styling**: Tailwind CSS with custom theming
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite for development and production builds

### Backend Stack
- **Runtime**: Node.js with Express framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Session Management**: Express sessions with PostgreSQL store
- **API Architecture**: RESTful API design
- **Validation**: Zod schemas for request validation

### Database Schema
- **Users**: Authentication and profile data
- **Materials**: Raw material information and properties
- **Categories**: Material classification system
- **Vendors**: Supplier information and contacts
- **Formulations**: Recipe and cost data
- **Ingredients**: Material-formulation relationships
- **Audit Logs**: Activity tracking and history
- **Files**: Material documentation storage

### Security Features
- **Password Hashing**: Secure credential storage
- **Session Management**: Secure user sessions
- **Input Validation**: Server-side data validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin request handling

---

## User Interface Design

### Navigation Structure
- **Main Navigation**: Dashboard, Materials, Formulations, Vendors, Categories
- **Secondary Navigation**: Import/Export, Profile, Subscription
- **Responsive Design**: Mobile and desktop optimization
- **Dark Mode Support**: Theme switching capability

### Dashboard Layout
- **Metrics Grid**: 4-column KPI display
- **Performance Overview**: Financial summary widget
- **Activity Feed**: Recent changes and updates
- **Quick Actions**: Direct access to common functions

### Form Design
- **Progressive Disclosure**: Step-by-step data entry
- **Real-time Validation**: Immediate feedback on inputs
- **Auto-save Functionality**: Prevent data loss
- **Keyboard Navigation**: Tab and Enter key support

### Data Visualization
- **Color-coded Categories**: Visual material classification
- **Status Indicators**: Active/inactive states
- **Progress Indicators**: Loading and processing states
- **Alert Systems**: Success, warning, and error messages

---

## Business Logic & Calculations

### Cost Calculation Engine
```
Total Material Cost = Σ(Material Unit Cost × Quantity Used)
Unit Cost = Total Material Cost ÷ Batch Size
Profit Margin = (Selling Price - Unit Cost) ÷ Selling Price × 100
Markup = (Selling Price - Unit Cost) ÷ Unit Cost × 100
```

### Pricing Strategy
- **Suggested Pricing**: Unit Cost × (1 + Markup Percentage)
- **Profit Analysis**: Real-time profit calculations
- **Margin Optimization**: Target margin achievement tracking

### Inventory Management
- **Quantity Tracking**: Material usage monitoring
- **Cost Updates**: Automatic recalculation on price changes
- **Usage Analytics**: Material consumption patterns

---

## API Endpoints

### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Session termination
- `GET /api/user` - Current user information

### Materials Management
- `GET /api/raw-materials` - List all materials
- `POST /api/raw-materials` - Create new material
- `PUT /api/raw-materials/:id` - Update material
- `DELETE /api/raw-materials/:id` - Remove material
- `GET /api/material-categories` - List categories
- `POST /api/material-categories` - Create category

### Formulations
- `GET /api/formulations` - List formulations
- `POST /api/formulations` - Create formulation
- `PUT /api/formulations/:id` - Update formulation
- `DELETE /api/formulations/:id` - Remove formulation
- `GET /api/formulations/:id/ingredients` - Get ingredients
- `POST /api/formulations/:id/ingredients` - Add ingredient

### Vendors
- `GET /api/vendors` - List vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Remove vendor

### Analytics
- `GET /api/dashboard/stats` - Performance metrics
- `GET /api/dashboard/recent-activity` - Activity feed

### Subscription
- `GET /api/subscription/status` - Current plan status
- `POST /api/subscription/activate` - Plan activation
- `POST /api/users/create-trial` - Trial account creation

---

## Subscription Plans & Limits

### Free Trial
- **Duration**: Unlimited
- **Materials**: 5 maximum
- **Formulations**: 2 maximum
- **Vendors**: 2 maximum
- **Features**: All core functionality

### Starter Plan
- **Monthly Fee**: $29/month
- **Materials**: 50 maximum
- **Formulations**: 25 maximum
- **Vendors**: 10 maximum
- **Features**: Full feature access

### Professional Plan
- **Monthly Fee**: $79/month
- **Materials**: 500 maximum
- **Formulations**: 250 maximum
- **Vendors**: 100 maximum
- **Features**: Advanced analytics and reporting

### Unlimited Plan
- **Monthly Fee**: Custom pricing
- **Materials**: Unlimited
- **Formulations**: Unlimited
- **Vendors**: Unlimited
- **Features**: Enterprise support and customization

---

## Integration Capabilities

### Shopify Billing Integration
- **Webhook Processing**: Automatic subscription activation
- **User Provisioning**: Account creation from purchases
- **Plan Management**: Automated tier assignments
- **Payment Processing**: Secure transaction handling

### Trial-to-Paid Conversion
- **Seamless Upgrade**: Direct upgrade paths from trial
- **Data Preservation**: Complete data migration on upgrade
- **Usage Notifications**: Limit warnings and upgrade prompts

### Import/Export Functionality
- **Data Export**: CSV and JSON format support
- **Bulk Import**: Material and formulation batch uploads
- **Backup Solutions**: Complete data export capabilities

---

## Performance & Scalability

### Database Optimization
- **Indexed Queries**: Optimized search performance
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Minimized database round trips

### Caching Strategy
- **Client-side Caching**: TanStack Query cache management
- **API Response Caching**: Reduced server load
- **Static Asset Optimization**: CDN-ready builds

### Monitoring & Analytics
- **Performance Tracking**: Response time monitoring
- **Error Logging**: Comprehensive error reporting
- **Usage Analytics**: Feature utilization tracking

---

## Security & Compliance

### Data Protection
- **Encryption**: Data at rest and in transit
- **Access Controls**: Role-based permissions
- **Audit Trails**: Complete activity logging
- **Backup Systems**: Regular data backups

### Privacy Compliance
- **Data Minimization**: Only essential data collection
- **User Consent**: Transparent data usage
- **Data Retention**: Configurable retention policies
- **Right to Delete**: User data removal capabilities

---

## Deployment & Infrastructure

### Hosting Requirements
- **Server**: Node.js compatible hosting
- **Database**: PostgreSQL 13+ required
- **Storage**: File attachment support
- **SSL**: HTTPS encryption mandatory

### Environment Configuration
- **Development**: Local development setup
- **Staging**: Pre-production testing environment
- **Production**: Live deployment configuration
- **Monitoring**: Health checks and alerts

### Backup & Recovery
- **Database Backups**: Daily automated backups
- **File Storage**: Redundant file storage
- **Disaster Recovery**: Multi-region availability
- **Point-in-time Recovery**: Historical data restoration

---

## Future Roadmap

### Planned Features
- **Mobile Applications**: iOS and Android apps
- **Advanced Analytics**: Predictive cost modeling
- **API Access**: Third-party integrations
- **Multi-language Support**: Internationalization
- **Batch Processing**: Large-scale operations
- **Supply Chain Integration**: Vendor API connections

### Enhancement Areas
- **AI-powered Insights**: Automated optimization suggestions
- **Collaborative Features**: Team workspaces
- **Regulatory Compliance**: Industry-specific requirements
- **Custom Reporting**: User-defined report generation

---

## Support & Documentation

### User Support
- **Knowledge Base**: Comprehensive user guides
- **Video Tutorials**: Step-by-step instructions
- **Email Support**: Technical assistance
- **Community Forum**: User community platform

### Developer Resources
- **API Documentation**: Complete endpoint reference
- **Integration Guides**: Third-party connection help
- **SDK Development**: Software development kits
- **Webhook Documentation**: Event notification setup

---

This specification document represents the complete functionality of Pipps Maker Calc as implemented in version 1.0. The platform provides a comprehensive solution for formulation-based businesses to manage costs, optimize pricing, and streamline product development workflows.