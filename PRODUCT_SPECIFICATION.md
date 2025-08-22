
# PIPPS Maker Calc - Product Specification

**Last Updated:** August 22, 2025

## Recent Changelog (August 2025)
- Removed all PayPal and Shopify integration (manual payment/admin workflow only)
- Added manual downgrade request system (user requests, admin processes, email notifications)
- Improved admin subscription update workflow (instant user info update)
- Added button locking to prevent duplicate requests/emails
- Enhanced email notification system for downgrades
- Improved audit logging and admin controls


**Note**: This document is for informational purposes only and does not contain actual user data.

## Product Overview
**Product Name:** PIPPS Maker Calc  
**Version:** 1.0  
**Target Market:** Small to medium manufacturing businesses, product formulators, cosmetic manufacturers, food producers  
**Platform:** Web Application (SaaS)  
**Authentication:** Email-based login system

## Core Purpose
PIPPS Maker Calc is a comprehensive product formulation and cost management tool designed for businesses that create physical products. The platform enables users to manage raw materials, create formulations, track costs, and generate tiered reports for business decision-making with subscription-based access controls.

## Key Features

### 1. Material Management
- **Raw Material Database**: Add, edit, and organize raw materials with name, SKU, cost, quantity, and unit information
- **Vendor Management**: Track supplier information with contact details and email addresses
- **Category Organization**: Organize materials by custom categories with color coding (Free tier: 2 categories)
- **Cost Tracking**: Monitor total cost and automatically calculated unit costs
- **File Attachments**: Attach specifications, certificates, and documents to materials
- **Bulk Import**: CSV import functionality with automated vendor/category setup
- **Duplicate Management**: Remove duplicate materials with one-click cleanup

### 2. Formulation Creation
- **Recipe Builder**: Create detailed product formulations with ingredients and quantities
- **Cost Calculations**: Automatic cost calculations for total cost, unit cost, and profit margins
- **Ingredient Management**: Add/remove ingredients with quantity and percentage calculations
- **Batch Information**: Track batch size and scaling for different production volumes
- **File Attachments**: Attach documents and specifications to formulations
- **Export Options**: Generate reports and documentation
- **Manual Data Refresh**: Users can refresh formulation costs after material changes using the dedicated refresh button to ensure accurate calculations

### 3. Reporting & Analytics (Tiered Access)
- **Free Tier**: Material Database Value and Basic Cost Analysis
- **Pro Tier**: All Free reports plus Advanced Analytics and Custom Reports  
- **Business Tier**: All Pro reports plus Multi-location Analysis and Team Reports
- **Enterprise Tier**: All Business reports plus API Access and Custom Integrations
- **Export Functionality**: PDF and JSON export for reports
- **Preview System**: Higher tier features shown as previews with upgrade prompts

### 4. User Management & Authentication
- **Email-Only Authentication**: Secure login with email and password
- **Password Reset**: Token-based password reset via email
- **User Profiles**: Company name and contact information management
- **Activity Logging**: Track user actions and changes for audit purposes
- **Session Management**: Secure session handling with logout functionality

## Subscription Tiers


### Free ($0/forever)
- **Raw Materials**: Up to 5
- **Formulations**: Up to 1
- **Vendors**: 2 vendors & 2 categories
- **Features**: Basic cost calculations
- **File Attachments**: 1 file attachment
- **Storage**: 5MB storage
- **Support**: Help documentation

### Starter ($7/month)
- **Raw Materials**: Up to 20
- **Formulations**: Up to 8
- **Vendors**: 5 vendors & 5 categories
- **Features**: Basic cost calculations
- **File Attachments**: 5 file attachments
- **Storage**: 30MB storage
- **Support**: Email support

### Pro ($19/month)
- **Raw Materials**: Up to 100
- **Formulations**: Up to 25
- **Vendors**: 10 vendors & 10 categories
- **Features**: CSV import/export, Cost optimization tools
- **File Attachments**: 10 file attachments
- **Storage**: 100MB storage
- **Support**: Email support

### Professional ($39/month)
- **Raw Materials**: Up to 300
- **Formulations**: Up to 60
- **Vendors**: 20 vendors & 20 categories
- **Features**: Advanced cost analytics, Batch optimization
- **File Attachments**: 25 file attachments
- **Storage**: 500MB storage
- **Support**: Priority email support

### Business ($65/month)
- **Raw Materials**: Up to 500
- **Formulations**: Up to 100
- **Vendors**: 25 vendors & 25 categories
- **Features**: Advanced reporting & analytics, Multi-user access
- **File Attachments**: 50 file attachments
- **Storage**: 1GB storage
- **Support**: Priority email support

### Enterprise ($149/month)
- **Raw Materials**: Up to 1,000
- **Formulations**: Up to 250
- **Vendors**: 50 vendors & 50 categories
- **Features**: Premium reporting suite & custom analytics, Custom integrations
- **File Attachments**: 100 file attachments
- **Storage**: 10GB storage
- **Support**: Dedicated support manager


**Current Implementation**: The application enforces all subscription limits shown above. Free tier users are limited to 5 materials, 1 formulation, 2 vendors, and 2 categories. Higher tiers have their respective limits enforced, with Enterprise tier having unlimited access.

**Manual Subscription Workflow (2025):**
- All payments and upgrades/downgrades are handled manually by the admin (no PayPal/Shopify integration)
- Users request upgrades/downgrades via the app (downgrade triggers email to admin and user)
- Admin updates user subscription status and plan via the admin panel
- User info is updated instantly after admin action
- Button locking prevents duplicate requests/emails

**Note**: This document is for informational purposes only and does not contain actual user data.

## Application Modules

### 1. Dashboard
- **Performance Metrics Display**: Real-time overview with material count, formulations, and vendor totals
- **Key Performance Indicators**: Total materials, active formulations, vendor relationships
- **Recent Activity Feed**: Audit trail of system changes and updates with timestamps
- **Quick Actions**: Direct access to add material and create formulation functions
- **Navigation Hub**: Central access point to all application modules

### 2. Raw Materials
- **Material Database**: Comprehensive listing of all raw materials with search and filtering
- **Material Properties**: Name, SKU, category assignment, vendor linkage, cost tracking
- **Bulk Operations**: CSV import, duplicate removal, batch editing capabilities
- **Cost Management**: Unit cost calculations, total cost tracking, price history
- **File Attachments**: Document and specification attachment system
- **Advanced Search**: Filter by name, SKU, category, vendor, or cost ranges

### 3. Formulations
- **Recipe Builder**: Create and edit product formulations with ingredient selection
- **Ingredient Management**: Add/remove materials with quantity and percentage calculations
- **Cost Analysis**: Automatic total cost, unit cost, and profit margin calculations
- **Batch Scaling**: Support for different production volumes and batch sizes
- **Status Management**: Active/inactive formulation states
- **Documentation**: File attachment system for formulation specifications

### 4. Vendors
- **Supplier Database**: Complete vendor information management system
- **Contact Management**: Email addresses, communication tracking, vendor details
- **Material Relationships**: Link vendors to specific materials for sourcing
- **Cost Monitoring**: Track pricing changes and vendor performance
- **Search and Filter**: Locate vendors by name, contact information, or linked materials

### 5. Categories
- **Organization System**: Color-coded classification for materials
- **Tier Restrictions**: Free tier limited to 2 categories, unlimited for paid tiers
- **Visual Management**: Color assignment for easy material identification
- **Hierarchy**: Structured categorization for logical material grouping
- **Material Assignment**: Link materials to appropriate categories

### 6. Import/Export
- **CSV Import**: Bulk material import with automated vendor/category creation
- **Data Export**: Export materials, formulations, and reports in various formats
- **Setup Automation**: One-click vendor and category setup for imports
- **Duplicate Management**: Automated detection and removal of duplicate entries
- **Format Support**: CSV, PDF, and JSON export capabilities

### 7. Reports
- **Tiered Access System**: Four-tier reporting (Free, Pro, Business, Enterprise)
- **Free Reports**: Material Database Value and Basic Cost Analysis
- **Advanced Analytics**: Pro+ tier features with detailed insights
- **Preview System**: Higher-tier feature previews to encourage upgrades
- **Export Options**: PDF and JSON report generation
- **Real-time Updates**: Reports automatically refresh with data changes

### 8. Payments
- **Transaction History**: Record of all payment transactions and billing
- **Subscription Status**: Current plan information and billing cycle
- **Manual Management**: Admin-controlled subscription updates (no PayPal/Shopify integration)
- **Billing Records**: Complete payment audit trail

### 9. Help & Support
- **Documentation System**: Comprehensive help articles with priority labels
- **Search Functionality**: Find help topics by keyword or category
- **Priority Levels**: Essential, Helpful, and Advanced article classifications
- **Category Organization**: Topics grouped by feature area and complexity
- **Support Contact**: Email support access and contact information

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

### Customer Support Interface
- **Live Chat Widget**: Floating chat button on all pages
- **Contact Collection**: Name, email, and message capture
- **Email Integration**: Direct delivery to support team inbox
- **Real-time Notifications**: Success/error feedback to users

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

### Support
- `POST /api/support` - Submit support requests via chat widget or contact forms

### Subscription
- `GET /api/subscription/status` - Current plan status
- `POST /api/subscription/activate` - Plan activation
- `POST /api/subscribe` - Request plan change (upgrade/downgrade)
- `POST /api/admin/update-subscription` - Admin updates user subscription
- `POST /api/users/create-trial` - Trial account creation

---

## Integration Capabilities


### Manual Subscription Management (2025)
- **No PayPal/Shopify**: All payments and plan changes are handled outside the app
- **Admin Workflow**: Admin updates user plans/status via admin panel
- **Email Notifications**: Downgrade requests trigger admin and user emails
- **Audit Logging**: All admin changes are logged


### Trial-to-Paid Conversion
- **Seamless Upgrade**: Direct upgrade paths from trial (admin-activated)
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