# Bitwise Server

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Backend API server for the Bitwise learning platform, built with NestJS and TypeScript.

## Overview

Bitwise Server is a RESTful API service that powers the Bitwise educational platform. It provides comprehensive functionality for managing user authentication, lessons, assessments, adaptive learning paths, and user progress tracking. The server leverages AI integration for intelligent content generation and personalized learning experiences.

## Core Features

- **Authentication & Authorization** - Secure JWT-based authentication with Passport.js
- **Lesson Management** - CRUD operations for lessons and topics with structured content
- **Assessment System** - Dynamic assessment generation and evaluation
- **Adaptive Learning** - AI-powered personalized learning path recommendations
- **Progress Tracking** - Comprehensive user progress monitoring and analytics
- **Calculator Tools** - Interactive binary/decimal conversion utilities
- **Bookmark System** - User content bookmarking functionality
- **AI Integration** - Integration with Google Gemini and Groq for content generation

## Technology Stack

### Core Framework
- **NestJS** - Progressive Node.js framework for building efficient and scalable server-side applications
- **TypeScript** - Strongly typed programming language
- **Fastify** - High-performance web framework

### Database & ORM
- **PostgreSQL** - Primary database
- **Prisma** - Next-generation ORM for type-safe database access
- **Supabase** - Backend-as-a-Service for database hosting and authentication

### AI & Machine Learning
- **Google Generative AI** - AI SDK for content generation
- **Groq AI SDK** - AI model integration
- **Vercel AI SDK** - AI utilities and helpers

### Authentication & Security
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Token implementation
- **Class Validator** - Validation decorators
- **Class Transformer** - Object transformation utilities

### Development Tools
- **ESLint** - Code linting and quality assurance
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **SWC** - Fast TypeScript/JavaScript compiler

## Prerequisites

Before running the server, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database
- **Git**

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bitwise-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/bitwise"
DIRECT_URL="postgresql://user:password@localhost:5432/bitwise"

# Authentication
JWT_SECRET="your-secret-key"

# AI Services
GOOGLE_AI_API_KEY="your-google-ai-key"
GROQ_API_KEY="your-groq-api-key"

# Supabase (optional)
SUPABASE_URL="your-supabase-url"
SUPABASE_KEY="your-supabase-key"
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npx prisma migrate dev
```

### 5. Seed Database (Optional)

```bash
npm run db:seed
```

### 6. Run the Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000` (or your configured port).

## Available Scripts

### Development

```bash
npm run start:dev          # Start development server with watch mode
npm run start:debug        # Start development server in debug mode
```

### Production

```bash
npm run build              # Build the application
npm run start              # Start production server
npm run start:prod         # Start production server (alias)
```

### Database

```bash
npm run prisma:generate    # Generate Prisma client
npm run db:seed           # Seed database with initial data
```

### Code Quality

```bash
npm run lint              # Lint and fix code
npm run format            # Format code with Prettier
```

### Testing

```bash
npm run test              # Run unit tests
npm run test:watch        # Run tests in watch mode
npm run test:cov          # Run tests with coverage report
npm run test:debug        # Run tests in debug mode
npm run test:e2e          # Run end-to-end tests
```

## Project Structure

```
bitwise-server/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── prisma.module.ts       # Prisma module
│   └── prisma.service.ts      # Prisma service
├── src/
│   ├── adaptive/              # Adaptive learning module
│   ├── assessment/            # Assessment management
│   ├── auth/                  # Authentication & authorization
│   ├── bookmark/              # Bookmark functionality
│   ├── calculator/            # Calculator tools
│   ├── config/                # Configuration files
│   ├── lessons/               # Lesson management
│   ├── user/                  # User management
│   ├── user-progress/         # Progress tracking
│   ├── app.module.ts          # Root application module
│   └── main.ts                # Application entry point
├── test/                      # E2E tests
├── .env                       # Environment variables
├── nest-cli.json             # NestJS CLI configuration
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration
```

## API Documentation

Once the server is running, API documentation is available at:

```
http://localhost:3000/api/docs
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `DIRECT_URL` | Direct database connection string | Yes |
| `JWT_SECRET` | Secret key for JWT token generation | Yes |
| `GOOGLE_AI_API_KEY` | Google AI API key | Yes |
| `GROQ_API_KEY` | Groq AI API key | Yes |
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_KEY` | Supabase API key | No |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license.