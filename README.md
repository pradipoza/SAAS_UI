# SaaS Chatbot Platform

A comprehensive SaaS platform for managing AI chatbots with separate admin and client interfaces, built with React, Express, and PostgreSQL.

## Architecture

- **Client Frontend** (Port 3002) - React + TypeScript + Vite
- **Admin Frontend** (Port 3000) - React + TypeScript + Vite  
- **Backend API** (Port 3001) - Express + TypeScript
- **Database** - PostgreSQL with pgvector extension

## Features

### Client Interface
- Dashboard with analytics and quick actions
- Channel-specific message management (WhatsApp, Facebook, Instagram, Website)
- Knowledge base document management
- CRM for customer contacts
- Bot settings and channel configuration
- Help & support messaging
- Payment and subscription management
- Account settings

### Admin Interface
- Overview dashboard with system metrics
- Analytics across all clients
- Payment management and financial tracking
- User management (registered users)
- Running projects management
- Client management and support
- System settings and configuration
- Customer service messaging

### Backend Features
- Role-based authentication (Admin/Client)
- JWT token management
- Email verification and password reset
- Payment gateway integration (Khalti, eSewa)
- Document processing and vector storage
- **Client-specific vector tables** for isolated RAG data
- Real-time messaging system
- Analytics and reporting
- n8n-ready vector architecture

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

### 1. Clone and Install Dependencies

```bash
# Install dependencies for all projects
cd client-frontend && npm install
cd ../admin-frontend && npm install  
cd ../backend && npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb saas_database

# Install pgvector extension
psql -d saas_database -c "CREATE EXTENSION IF NOT EXISTS vector;"

# Run database migrations
cd backend
npx prisma migrate deploy

# Create vector tables for existing clients (if migrating)
node scripts/createVectorTablesForExistingClients.js
```

> 📚 **See [backend/VECTOR_SETUP_README.md](backend/VECTOR_SETUP_README.md) for detailed vector table documentation**

### 3. Environment Configuration

Create `.env` files in each project:

**backend/.env:**
```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://username:password@localhost:5432/saas_database
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=30d
OPENAI_API_KEY=your-openai-api-key-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_FRONTEND_URL=http://localhost:3000
CLIENT_FRONTEND_URL=http://localhost:3002
```

**client-frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
```

**admin-frontend/.env:**
```env
VITE_API_URL=http://localhost:3001
```

### 4. Start Development Servers

Open 3 terminal windows and run:

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Client Frontend  
cd client-frontend
npm run dev

# Terminal 3 - Admin Frontend
cd admin-frontend
npm run dev
```

### 5. Access Applications

- **Client Interface**: http://localhost:3002
- **Admin Interface**: http://localhost:3000
- **Backend API**: http://localhost:3001

## Default Credentials

### Admin
- Email: admin@example.com
- Password: password

### Client
- Email: client@example.com  
- Password: password

## Project Structure

```
saas-chatbot-platform/
├── client-frontend/          # Client React app (Port 3002)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
│
├── admin-frontend/           # Admin React app (Port 3000)
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── context/         # React context (Auth)
│   │   ├── services/        # API services
│   │   └── types/           # TypeScript types
│   └── package.json
│
└── backend/                  # Express API (Port 3001)
    ├── src/
    │   ├── controllers/     # Route controllers
    │   ├── middleware/      # Express middleware
    │   ├── routes/          # API routes
    │   ├── services/        # Business logic (incl. vector ops)
    │   ├── models/          # Database models
    │   ├── types/           # TypeScript types
    │   └── database/        # Database config & migrations
    ├── docs/                # Documentation
    │   ├── CLIENT_VECTOR_TABLES.md
    │   ├── N8N_INTEGRATION_EXAMPLES.md
    │   └── QUICK_REFERENCE.md
    ├── scripts/             # Utility scripts
    ├── VECTOR_SETUP_README.md
    └── package.json
```

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Router v6** for routing
- **React Query** for data fetching
- **React Hook Form** + **Zod** for forms
- **Zustand** for state management
- **Lucide React** for icons

### Backend
- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** with **pgvector** extension
- **JWT** for authentication
- **bcryptjs** for password hashing
- **OpenAI API** for embeddings
- **Khalti** + **eSewa** payment gateways
- **PDFKit** for invoice generation
- **Nodemailer** for email services

## Development

### Available Scripts

**Frontend (both client and admin):**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

**Backend:**
```bash
npm run dev          # Start with nodemon
npm run build        # Build TypeScript
npm start            # Start production server
```

### Database Migrations

```bash
# Run migrations
npm run migrate

# Seed database
npm run seed
```

## Deployment

### Frontend Deployment
- Deploy to Vercel, Netlify, or similar
- Update API URLs in environment variables

### Backend Deployment  
- Deploy to Railway, Render, or AWS
- Configure PostgreSQL database
- Set environment variables

### Database
- Use Neon, Supabase, or AWS RDS
- Ensure pgvector extension is enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
