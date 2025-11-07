# 🏢 Company Docs Manager - Backend

Backend API built with NestJS 10 for Company Documents Management System.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL 16+
- Redis 7+ (optional but recommended)
- MinIO (for file storage)

### Installation

```bash
# Install dependencies
npm install

# Setup environment variables
cp env.example.txt .env
# Edit .env with your configuration

# Generate Prisma Client
npx prisma generate

# Run migrations
npm run migrate

# Seed database with initial data
npm run seed
```

### Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The API will be available at:
- **API**: http://localhost:5000/api/v1
- **Swagger Docs**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/api/v1/health

## 📚 Default Credentials

After running `npm run seed`, you can login with:

### Super Admin
- **Email**: `admin@companydocs.com`
- **Password**: `Admin@123`
- **Role**: SUPER_ADMIN

### Supervisor  
- **Email**: `supervisor@companydocs.com`
- **Password**: `Supervisor@123`
- **Role**: SUPERVISOR

### Employee
- **Email**: `employee@companydocs.com`
- **Password**: `Employee@123`
- **Role**: EMPLOYEE

## 🛠️ Tech Stack

- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis
- **Storage**: MinIO (S3-compatible)
- **Authentication**: JWT + Passport.js
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding
│   └── migrations/           # Database migrations
│
├── src/
│   ├── common/               # Shared components
│   │   ├── decorators/      # Custom decorators
│   │   ├── dto/             # Common DTOs
│   │   ├── enums/           # Enums
│   │   └── filters/         # Exception filters
│   │
│   ├── database/            # Database module
│   │   ├── database.module.ts
│   │   └── prisma.service.ts
│   │
│   ├── modules/             # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── users/          # Users management
│   │   ├── companies/      # Companies management
│   │   ├── documents/      # Documents management
│   │   └── ...
│   │
│   ├── app.module.ts       # Root module
│   ├── app.controller.ts   # Root controller
│   ├── app.service.ts      # Root service
│   └── main.ts            # Application entry point
│
└── test/                   # Tests
```

## 🔧 Available Scripts

```bash
# Development
npm run start:dev          # Start in watch mode
npm run start:debug        # Start in debug mode

# Build
npm run build             # Build for production
npm run start:prod        # Run production build

# Database
npm run migrate           # Run migrations
npm run migrate:deploy    # Deploy migrations (production)
npm run seed             # Seed database
npm run studio           # Open Prisma Studio

# Testing
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run e2e tests

# Code Quality
npm run lint             # Lint code
npm run format           # Format code with Prettier
```

## 🌍 Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/company_docs"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=company-docs

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

# Frontend
FRONTEND_URL=http://localhost:3000
```

## 📖 API Documentation

After starting the server, visit:
- **Swagger UI**: http://localhost:5000/api-docs

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🐳 Docker Support

```bash
# Run with Docker Compose (from root directory)
docker-compose up -d backend

# Or build manually
docker build -t company-docs-backend .
docker run -p 5000:5000 company-docs-backend
```

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting (100 req/min per user)
- CORS configuration
- Helmet security headers
- Input validation
- SQL injection prevention (Prisma)
- XSS protection

## 📝 License

Proprietary - All rights reserved © 2025

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.

## 📞 Support

For issues and questions:
- Email: dev@companydocs.com
- GitHub Issues: [Link]
