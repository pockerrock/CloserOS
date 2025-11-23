# CloserOS

**AI-powered OS for high-ticket closers & setters**

Version: 2.0 — 2025-11-23

## 🎯 Overview

CloserOS combines scheduling, native calling, AI whisper coaching (trained on company docs), payments/contracts, and funnel analytics in one platform to reduce no-shows, shorten ramp time, and increase close rates for high-ticket sales teams.

## ✨ What's New in Part 2

### 🔧 Backend Services
- ✅ **S3 Service**: Complete file upload/download with MinIO (local) and AWS S3 (production) support
- ✅ **Stripe Integration**: Full payment processing with checkout sessions, webhooks, and refunds
- ✅ **Daily.co Service**: WebRTC calling with room creation, meeting tokens, and recordings
- ✅ **Enhanced Webhooks**: Automatic deal updates on payment success, recording processing

### 🎨 Frontend Application
- ✅ **Authentication Pages**: Full login and register flows with validation
- ✅ **API Client**: Axios-based client with automatic token refresh
- ✅ **Auth Context**: React context for authentication state management
- ✅ **Dashboard**: Welcome dashboard with user info and quick actions

### 📡 API Enhancements
- ✅ **Checkout Endpoint**: `POST /api/deals/:id/checkout` creates Stripe sessions
- ✅ **Meeting Tokens**: Generate Daily.co tokens for secure call access
- ✅ **Document Upload**: Real S3 upload with metadata support

## ✨ What's New in Part 3

### 🎨 Complete Dashboard UI

#### Dashboard Layout
- ✅ **Sidebar Navigation**: Full-featured navigation with Dashboard, Leads, Deals, Calls, Documents
- ✅ **Top Bar**: Workspace name display and page titles
- ✅ **User Footer**: User info with logout functionality
- ✅ **Active Route Highlighting**: Visual feedback for current page

#### Dashboard Home (`/dashboard`)
- ✅ **Stats Cards**: Total Leads, Active Deals, Calls Today, Revenue metrics
- ✅ **Quick Actions**: Create Lead, Start Call, View Pipeline, Upload Documents
- ✅ **Getting Started Guide**: Onboarding checklist with completed features
- ✅ **Welcome Message**: Personalized greeting with user's name

#### Leads Management (`/leads`)
- ✅ **Table View**: Complete leads list with Name, Email, Phone, Source, Assigned To, Created date
- ✅ **Create Lead Modal**: Form with firstName, lastName, email, phone, source, notes
- ✅ **URL Param Support**: `?action=new` deep link to open create modal
- ✅ **Empty State**: Call-to-action when no leads exist
- ✅ **Edit & View Actions**: Navigate to lead detail pages

#### Deals Pipeline (`/deals`)
- ✅ **Kanban Board**: 7-column pipeline (New → Qualified → Scheduled → Showed → Closed → Paid → Recycle)
- ✅ **Deal Cards**: Show lead name, email, amount, closer assignment
- ✅ **Stage Totals**: Count and total value per stage
- ✅ **Payment Integration**: "Send Payment Link" button on Closed deals
- ✅ **Color Coding**: Visual distinction between pipeline stages
- ✅ **Stripe Checkout**: Opens Stripe checkout in new window

#### Calls Interface (`/calls`)
- ✅ **Active Calls Section**: In-progress calls with Rejoin and End Call buttons
- ✅ **Upcoming Calls Table**: Scheduled calls with Start Call button
- ✅ **Call History**: Completed calls with duration and recording status
- ✅ **Start Call Modal**: Quick call creation and instant start
- ✅ **Daily.co Integration**: Opens WebRTC rooms in new window
- ✅ **Real-time Updates**: Refresh after starting/ending calls

#### Documents Management (`/documents`)
- ✅ **File Upload**: Drag-and-drop style upload with hidden input pattern
- ✅ **Table View**: File Name, Type, Size, AI Status, Uploaded date
- ✅ **AI Status Display**: Shows embedding status (pending, processing, completed, failed)
- ✅ **Download & Delete**: Actions for each document
- ✅ **Empty State**: Encourages uploading first document
- ✅ **Info Card**: Explains AI coaching functionality

### 🎯 UX Improvements
- ✅ **Consistent Loading States**: Spinner animations throughout
- ✅ **Empty States**: Helpful guidance when lists are empty
- ✅ **Modal Patterns**: Clean create/edit forms
- ✅ **Table Sorting**: Organized data display
- ✅ **Responsive Design**: Mobile-friendly layouts
- ✅ **Error Handling**: User-friendly error messages

## ✨ What's New in Part 4

### 📄 Detail Pages

#### Lead Detail Page (`/leads/:id`)
- ✅ **Lead Information**: Full lead profile with all details
- ✅ **Edit Mode**: Inline editing of lead information
- ✅ **Associated Deals**: List of all deals for this lead with stage indicators
- ✅ **Quick Actions**: Email, call, create deal buttons
- ✅ **Activity Timeline**: History of lead updates
- ✅ **Delete Functionality**: Remove leads with confirmation

#### Deal Detail Page (`/deals/:id`)
- ✅ **Deal Overview**: Complete deal information and status
- ✅ **Stage Management**: Quick stage updates with visual progress indicator
- ✅ **Payment Details**: Stripe payment ID, paid date, amount
- ✅ **Timeline View**: Chronological history of deal events
- ✅ **Quick Actions**: Send payment link, email lead, view lead
- ✅ **Progress Tracker**: Visual pipeline position indicator

#### Call Detail Page (`/calls/:id`)
- ✅ **Call Information**: Status, participants, scheduled time, duration
- ✅ **Recording Viewer**: Embedded video player for call recordings
- ✅ **Transcript Display**: Full call transcript when available
- ✅ **AI Summary**: Automated call summary (when processed)
- ✅ **Call Controls**: Start, rejoin, end call buttons
- ✅ **Metrics Dashboard**: Recording status, transcript status, duration
- ✅ **Timeline Events**: Call lifecycle visualization

### ⚙️ Settings & Management

#### User Settings (`/settings`)
- ✅ **Profile Management**: Edit first name, last name
- ✅ **Password Change**: Secure password update with validation
- ✅ **Workspace Info**: View workspace name, ID, role
- ✅ **Tabbed Interface**: Clean navigation between settings sections
- ✅ **Success/Error Feedback**: Real-time validation and confirmation

#### Team Management (`/team`)
- ✅ **Team Overview**: Grid view of all workspace members
- ✅ **Team Stats**: Total members, closers, setters, admins count
- ✅ **Member Details**: Name, email, role, avatar display
- ✅ **Invite Modal**: Email invitation with role selection
- ✅ **Role-Based Access**: Only owners/admins can manage team
- ✅ **Permission Indicators**: Visual feedback for user permissions

### 🌐 Public Pages

#### Booking Page (`/book/:token`)
- ✅ **Public Access**: No login required, token-based access
- ✅ **Booking Details**: Date, time, duration, sales rep info
- ✅ **Confirmation**: One-click booking confirmation
- ✅ **Cancellation**: Cancel with reason and feedback
- ✅ **Status Display**: Pending, confirmed, canceled states
- ✅ **Info Section**: What to expect, reminders, preparation tips
- ✅ **Branded Experience**: Workspace name and professional layout

### 🔌 Backend Enhancements

#### Password Management
- ✅ **Update Password Endpoint**: `POST /api/users/me/password`
- ✅ **Current Password Verification**: Security validation
- ✅ **Password Hashing**: bcrypt encryption
- ✅ **Error Handling**: Clear error messages for invalid passwords

#### API Improvements
- ✅ **Enhanced Error Responses**: Detailed validation messages
- ✅ **Password Security**: Minimum 8 characters enforced
- ✅ **Token Validation**: Secure booking token verification

## ✨ What's New in Part 5

### 🤖 AI Service Implementation

#### Python AI Service
- ✅ **FastAPI Service**: Complete AI microservice with embeddings, STT, RAG, summarization
- ✅ **OpenAI Integration**: Text embeddings using text-embedding-3-small
- ✅ **Deepgram STT**: Speech-to-text with speaker diarization
- ✅ **Claude/GPT Summarization**: Call summaries with key points, objections, sentiment
- ✅ **pgvector RAG**: Document retrieval and question answering

#### Document Processing
- ✅ **Text Extraction**: PDF, DOCX, TXT file support
- ✅ **Text Chunking**: Smart chunking with overlap for better embeddings
- ✅ **Batch Embeddings**: Efficient batch processing of document chunks
- ✅ **Vector Storage**: pgvector integration for semantic search

#### Call Intelligence
- ✅ **Transcription Service**: Deepgram integration for high-quality transcripts
- ✅ **Call Summarization**: Automated summaries with AI
- ✅ **Insights Extraction**: Topics, questions, pain points, buying signals
- ✅ **Sentiment Analysis**: Positive, neutral, negative classification

#### Knowledge Base (RAG)
- ✅ **Semantic Search**: Vector similarity search with pgvector
- ✅ **Context Retrieval**: Retrieve relevant document chunks
- ✅ **Answer Generation**: LLM-powered answers with sources
- ✅ **Confidence Scoring**: Relevance-based confidence metrics

#### AI Service Client (NestJS)
- ✅ **AiService Module**: Global module for AI operations
- ✅ **HTTP Client**: Axios-based client to Python AI service
- ✅ **Mock Mode**: Development mode without API keys
- ✅ **Error Handling**: Comprehensive error logging and handling

### 📊 Analytics & Reporting

#### Analytics Endpoints
- ✅ **Dashboard Metrics**: Leads, deals, calls, revenue by period (7d, 30d, 90d)
- ✅ **Funnel Analytics**: Deal counts and values by stage
- ✅ **Team Performance**: Individual closer metrics and leaderboard
- ✅ **API Endpoints**: `/api/analytics/dashboard`, `/api/analytics/funnel`, `/api/analytics/team-performance`

### 🌐 Landing Page

#### Marketing Site (`/`)
- ✅ **Hero Section**: Value proposition and CTAs
- ✅ **Features Showcase**: 6 key features with icons
- ✅ **Call-to-Action**: Sign up and login buttons
- ✅ **Professional Design**: Gradient backgrounds and responsive layout

## 🏗️ Architecture

This is a monorepo containing:

- **apps/landing**: Next.js landing page (public marketing site)
- **apps/web-app**: Next.js web application (authenticated user interface)
- **services/api**: NestJS backend API with REST endpoints
- **services/ai**: Python AI service for embeddings, RAG, and STT processing
- **infra**: Infrastructure as Code and deployment scripts

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker and Docker Compose
- Python >= 3.10 (for AI service)

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd CloserOS

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
```

### 2. Start Development Environment

```bash
# Start Docker services (Postgres, Redis, MinIO)
npm run docker:up

# Run database migrations
npm run db:migrate

# Seed the database with demo data
npm run db:seed

# Start all services in development mode
npm run dev
```

This will start:
- **API**: http://localhost:3001
- **Web App**: http://localhost:3000
- **Landing**: http://localhost:3002
- **API Docs**: http://localhost:3001/api/docs

### 3. Demo Credentials

After seeding, you can log in with these demo accounts:

- **Owner**: owner@demo.com / password123
- **Closer**: closer@demo.com / password123
- **Setter**: setter@demo.com / password123

## 📦 Project Structure

```
/CloserOS
  ├── /apps
  │   ├── /landing          # Next.js landing page
  │   └── /web-app          # Next.js web application
  ├── /services
  │   ├── /api              # NestJS backend
  │   │   ├── /src
  │   │   │   ├── /auth           # Authentication (JWT, login, register)
  │   │   │   ├── /users          # User management
  │   │   │   ├── /workspaces     # Workspace management
  │   │   │   ├── /calls          # WebRTC calls (Daily.co integration)
  │   │   │   ├── /leads          # Lead management (CRM)
  │   │   │   ├── /deals          # Deal pipeline
  │   │   │   ├── /bookings       # Scheduling & bookings
  │   │   │   ├── /documents      # Document upload & storage
  │   │   │   ├── /webhooks       # Webhook handlers
  │   │   │   └── /common         # Shared modules (Prisma, etc.)
  │   │   └── /prisma       # Database schema & migrations
  │   ├── /ai               # Python AI service
  │   └── /media            # Media handling (optional)
  ├── /infra
  │   ├── /terraform        # IaC for AWS deployment
  │   └── /docker-compose   # Local development configs
  ├── /scripts              # Utility scripts
  ├── /tests                # E2E tests
  ├── docker-compose.yml
  ├── package.json
  └── README.md
```

## 🛠️ Available Scripts

### Root Level

```bash
npm run dev              # Start all services in dev mode
npm run build            # Build all services
npm run test             # Run all tests
npm run lint             # Lint all code
npm run format           # Format code with Prettier

# Docker commands
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services

# Database commands
npm run db:migrate       # Run Prisma migrations
npm run db:seed          # Seed database with demo data
npm run db:studio        # Open Prisma Studio
```

### Individual Services

```bash
# API Service
npm run dev:api          # Start API in dev mode
npm run build:api        # Build API
npm run test:api         # Test API

# Web App
npm run dev:web          # Start web app in dev mode
npm run build:web        # Build web app

# Landing Page
npm run dev:landing      # Start landing in dev mode
npm run build:landing    # Build landing

# AI Service
npm run dev:ai           # Start AI service
```

## 🗄️ Database

CloserOS uses PostgreSQL with the pgvector extension for embeddings.

### Schema Overview

Key models:
- **Workspace**: Organization/team container
- **User**: Team members (Owner, Admin, Closer, Setter)
- **Lead**: Prospects in the pipeline
- **Deal**: Sales opportunities with stages (New → Qualified → Scheduled → Showed → Closed → Paid → Recycle)
- **Booking**: Scheduled calls
- **Call**: WebRTC sessions with recordings and transcripts
- **Document**: Uploaded files for AI training
- **DocumentEmbedding**: Vector embeddings for RAG

### Migrations

```bash
# Create a new migration
cd services/api
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

## 🔐 Environment Variables

Key environment variables (see `.env.example` for complete list):

### Database
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string

### Authentication
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens

### Services
- `DAILY_API_KEY`: Daily.co API key for WebRTC
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `STRIPE_SECRET_KEY`: Stripe secret key for payments
- `TWILIO_ACCOUNT_SID`: Twilio SID for SMS
- `GOOGLE_CLIENT_ID`: Google OAuth for calendar sync

### Mock Modes (Development)
Set these to `true` for local development without external services:
- `DAILY_MOCK_MODE=true`
- `DEEPGRAM_MOCK_MODE=true`
- `TWILIO_MOCK_MODE=true`
- `STRIPE_TEST_MODE=true`

## 🔌 API Documentation

Once the API is running, visit:

**Swagger UI**: http://localhost:3001/api/docs

### Key Endpoints

#### Authentication
- `POST /api/auth/register` - Register new workspace and owner
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

#### Leads & Deals
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `GET /api/deals` - List deals
- `PATCH /api/deals/:id/stage` - Update deal stage

#### Calls
- `POST /api/calls` - Create call
- `POST /api/calls/:id/start` - Start call (returns Daily.co room URL)
- `GET /api/calls/:id/transcript` - Get call transcript

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/token/:token` - Public booking lookup

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run API tests
npm run test:api

# Run E2E tests
cd tests
npm run test:e2e

# Watch mode
npm run test:watch

# Coverage
npm run test:cov
```

## 🚢 Deployment

### Production Checklist

1. **Environment Variables**
   - Set production DATABASE_URL (RDS)
   - Configure AWS credentials for S3
   - Set production API keys (Daily, Stripe, Twilio, OpenAI)
   - Update CORS_ORIGIN for production domain
   - Generate strong JWT secrets

2. **Database**
   - Run migrations: `npx prisma migrate deploy`
   - Ensure pgvector extension is enabled

3. **Build**
   ```bash
   npm run build
   ```

4. **Deploy**
   - API: Deploy to AWS ECS/Fargate or similar
   - Web App: Deploy to Vercel or AWS
   - Landing: Deploy to Vercel
   - AI Service: Deploy as containerized service

### Docker Production Build

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production stack
docker-compose -f docker-compose.prod.yml up -d
```

## 🎯 Roadmap

### Q1 (MVP Launch)
- ✅ Scheduling & Google Calendar sync
- ✅ WebRTC calls via Daily.co
- ✅ Recording → STT → AI summary
- ✅ Stripe payments
- ✅ Basic CRM & pipeline
- ⏳ Beta with 5-10 customers

### Q2
- Real-time whisper coaching
- WhatsApp integration
- Contract templates + eSign
- Advanced vector DB (Pinecone)

### Q3
- PSTN dialer
- Multi-language support
- CRM integrations (HubSpot, Pipedrive)
- Advanced analytics & forecasting

### Q4
- Enterprise SSO
- Audit features
- Marketplace integrations
- Automated lead recycling

## 🤝 Contributing

This is a private repository for CloserOS development.

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📝 License

Copyright © 2025 CloserOS. All rights reserved.

## 🆘 Support

For issues or questions:
- Check the [API Documentation](http://localhost:3001/api/docs)
- Review the [BRD Document](./docs/BRD.md)
- Contact the development team

---

**Built with ❤️ for high-ticket closers**
