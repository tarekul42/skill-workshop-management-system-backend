# Skill Workshop Management System (Backend)

> **Empowering experts and seekers with a secure, high-performance educational ecosystem.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A048.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Cache-Redis-DC382D.svg)](https://redis.io/)

---

### 🎯 Pro-Level Summary

This repository houses the backend infrastructure for the **Skill Workshop Management System**. It is architected for maximum performance and security, bridging the gap between industry experts and students through a feature-rich RESTful API. This system emphasizes production-ready execution, emphasizing **security**, **scalability**, and **modular design**.

---

## Features

- **Workshop Lifecycle Management**: Complete CRUD operations with advanced querying, filtering, and pagination.
- **Role-Based Access Control (RBAC)**: Fine-grained permissions for Admins and Students.
- **Automated OTP System**: Secure account verification and password resets using high-speed Redis storage.
- **Payment Gateway Integration**: Production-ready SSLCommerz integration with transaction logging and status tracking.
- **Asset Pipeline**: Automated image uploads and management via Cloudinary.
- **Rate Limiting**: Integrated security middleware to prevent brute-force attacks and API abuse.
- **Multi-Modal Authentication**: JWT, Google OAuth 2.0, and credentials-based login.
- **Invoice Generation**: PDF invoice generation for payments.
- **Structured Logging (Pino)**: High-performance, JSON-based logging for production-grade observability.
- **Background Jobs (BullMQ)**: Asynchronous processing for emails, PDF generation, and time-consuming tasks.
- **Soft Deletes**: Data recovery and audit-ready deletion mechanism for core models.
- **Audit Trail System**: Real-time logging of all write operations (Create, Update, Delete) with entity-level tracking for accountability.
- **Observability & Metrics**: Integrated Prometheus metrics for real-time monitoring of HTTP traffic, database latency, and background job queues.
- **CI/CD Pipeline**: Automated GitHub Actions workflows for continuous integration, linting, testing, and security scanning.

---

## Technical Stack

| Category       | Technology                              |
| -------------- | --------------------------------------- |
| Runtime        | Bun (Optimized performance)             |
| Framework      | Express.js                              |
| Language       | TypeScript                              |
| Database       | MongoDB (Mongoose)                      |
| Cache          | Redis                                   |
| Queue          | BullMQ (Redis-backed background jobs)   |
| Authentication | JWT, Passport.js (Local + Google OAuth) |
| Logging        | Pino & Pino-Pretty                      |
| Validation     | Zod                                     |
| File Storage   | Cloudinary                              |
| Email          | Nodemailer                              |
| Payment        | SSLCommerz                              |
| Observability  | Prometheus (prom-client)                |
| CI/CD          | GitHub Actions                          |

### Architecture

The codebase adheres to a **Component-Based Modular Architecture**. Each domain (User, Workshop, Enrollment, Payment, etc.) is encapsulated within its own module, containing:

- **Interfaces**: Defining clear data contracts.
- **Models**: Handling data persistence and relationships.
- **Services**: Encapsulating core business logic.
- **Controllers**: Managing request orchestration.
- **Routes**: Defining API endpoints.
- **Validations**: Ensuring data integrity via Zod schemas.

---

## Project Structure

```
src/
├── app/
│   ├── config/              # Configuration files
│   │   ├── cloudinary.config.ts
│   │   ├── csrf.config.ts
│   │   ├── env.ts
│   │   ├── multer.config.ts
│   │   ├── passport.ts
│   │   └── redis.config.ts
│   ├── constants.ts         # App-wide constants
│   ├── errorHelpers/        # Custom error classes
│   ├── helpers/             # Error handling utilities
│   ├── interfaces/          # TypeScript interfaces
│   ├── middlewares/         # Express middlewares
│   │   ├── checkAuth.ts
│   │   ├── globalErrorHandler.ts
│   │   ├── notFound.ts
│   │   └── validateRequest.ts
│   ├── modules/              # Feature modules
│   │   ├── auth/             # Authentication
│   │   ├── category/         # Workshop categories
│   │   ├── enrollment/       # Workshop enrollments
│   │   ├── otp/              # OTP verification
│   │   ├── payment/           # Payment processing
│   │   ├── sslCommerz/       # SSLCommerz integration
│   │   ├── stats/            # Analytics & statistics
│   │   ├── user/             # User management
│   │   └── workshop/         # Workshop management
│   ├── route/               # Route definitions
│   ├── types/               # Type definitions
│   └── utils/               # Utility functions
├── server.ts                # Application entry point
└── app.ts                   # Express app setup
```

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **MongoDB**: Local instance or MongoDB Atlas URI
- **Redis**: Local instance or Redis Cloud URI
- **Package Manager**: `bun` (Recommended)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/tarekul42/skill-workshop-management-system-backend
   cd skill-workshop-management-system-backend
   ```

2. **Install dependencies**:

   ```bash
   bun install
   ```

3. **Environment Setup**:
   Create a `.env` file based on the template below.

### Run

**Development:**

```bash
bun run dev
```

**Production:**

```bash
bun run build
bun start
```

---

## API Documentation

The API is fully documented using **Swagger / OpenAPI 3.0**. You can explore the interactive documentation, test endpoints, and view data models at:

- **Local:** [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **Production:** [https://skill-workshop-management-system-backend.up.railway.app/api-docs](https://skill-workshop-management-system-backend.up.railway.app/api-docs)

### API Versioning

The API supports multiple versions to ensure backward compatibility:

- **v1 (Stable)**: The current stable version of the API. Accessible via `/api/v1/*`.
- **v2 (Beta)**: Used for introducing breaking changes safely. Accessible via `/api/v2/*`.

**Header-based versioning**: Clients can also specify the version using the `X-API-Version` header.

### Observability & Metrics

System metrics are exposed for Prometheus scraping at the `/metrics` endpoint. This includes:

- HTTP request duration and status codes.
- Database connection latency.
- Redis memory usage.
- Background job queue lengths.

---

## API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint                | Description            | Access |
| ------ | ----------------------- | ---------------------- | ------ |
| POST   | `/auth/login`           | Login with credentials | Public |
| POST   | `/auth/refresh-token`   | Get new access token   | Public |
| POST   | `/auth/logout`          | Logout user            | Public |
| POST   | `/auth/change-password` | Change password        | Auth   |
| POST   | `/auth/set-password`    | Set new password       | Auth   |
| POST   | `/auth/forgot-password` | Request password reset | Public |
| POST   | `/auth/reset-password`  | Reset password         | Auth   |
| GET    | `/auth/google`          | Google OAuth login     | Public |
| GET    | `/auth/google/callback` | Google OAuth callback  | Public |

### Users (`/api/v1/user`)

| Method | Endpoint          | Description              | Access |
| ------ | ----------------- | ------------------------ | ------ |
| POST   | `/user/register`  | Register new user        | Public |
| GET    | `/user/me`        | Get current user profile | Auth   |
| GET    | `/user/all-users` | Get all users            | Admin  |
| GET    | `/user/:id`       | Get single user          | Admin  |
| PATCH  | `/user/:id`       | Update user              | Auth   |

### Workshops (`/api/v1/workshop`)

| Method | Endpoint                 | Description         | Access |
| ------ | ------------------------ | ------------------- | ------ |
| GET    | `/workshop`              | Get all workshops   | Public |
| GET    | `/workshop/:slug`        | Get single workshop | Public |
| POST   | `/workshop/create`       | Create workshop     | Admin  |
| PATCH  | `/workshop/:id`          | Update workshop     | Admin  |
| DELETE | `/workshop/:id`          | Delete workshop     | Admin  |
| GET    | `/workshop/levels`       | Get all levels      | Public |
| POST   | `/workshop/create-level` | Create level        | Admin  |

### Categories (`/api/v1/category`)

| Method | Endpoint           | Description          | Access |
| ------ | ------------------ | -------------------- | ------ |
| GET    | `/category`        | Get all categories   | Public |
| GET    | `/category/:slug`  | Get category by slug | Public |
| POST   | `/category/create` | Create category      | Admin  |
| PATCH  | `/category/:id`    | Update category      | Admin  |
| DELETE | `/category/:id`    | Delete category      | Admin  |

### Enrollments (`/api/v1/enrollment`)

| Method | Endpoint             | Description            | Access |
| ------ | -------------------- | ---------------------- | ------ |
| GET    | `/enrollment`        | Get user enrollments   | Auth   |
| GET    | `/enrollment/:id`    | Get enrollment details | Auth   |
| POST   | `/enrollment/create` | Create enrollment      | Auth   |
| DELETE | `/enrollment/:id`    | Cancel enrollment      | Auth   |

### Payments (`/api/v1/payment`)

| Method | Endpoint                              | Description              | Access |
| ------ | ------------------------------------- | ------------------------ | ------ |
| POST   | `/payment/init-payment/:enrollmentId` | Initialize payment       | Auth   |
| POST   | `/payment/success`                    | Payment success callback | Public |
| POST   | `/payment/fail`                       | Payment fail callback    | Public |
| POST   | `/payment/cancel`                     | Payment cancel callback  | Public |
| GET    | `/payment/invoice/:paymentId`         | Download invoice         | Auth   |
| POST   | `/payment/validate-payment`           | Validate payment         | Auth   |

### OTP (`/api/v1/otp`)

| Method | Endpoint      | Description       | Access |
| ------ | ------------- | ----------------- | ------ |
| POST   | `/otp/send`   | Send OTP to email | Public |
| POST   | `/otp/verify` | Verify OTP        | Public |

### Stats (`/api/v1/stats`)

| Method | Endpoint            | Description           | Access |
| ------ | ------------------- | --------------------- | ------ |
| GET    | `/stats/enrollment` | Enrollment statistics | Admin  |
| GET    | `/stats/payment`    | Payment statistics    | Admin  |
| GET    | `/stats/users`      | User statistics       | Admin  |
| GET    | `/stats/workshops`  | Workshop statistics   | Admin  |

### Health (`/api/v1/health`)

| Method | Endpoint                | Description            | Access |
| ------ | ----------------------- | ---------------------- | ------ |
| GET    | `/health/`              | Root health endpoint   | Public |
| GET    | `/health/ping`          | Simple health ping     | Public |
| GET    | `/health/check-version` | Get API version        | Public |
| GET    | `/health/health-check`  | Detailed health status | Public |

### Audit (`/api/v1/audit`)

| Method | Endpoint     | Description          | Access |
| ------ | ------------ | -------------------- | ------ |
| GET    | `/audit`     | List all audit logs  | Admin  |
| GET    | `/audit/:id` | Get single audit log | Admin  |

### Infrastructure & Misc

| Method | Endpoint             | Description                 | Access |
| ------ | -------------------- | --------------------------- | ------ |
| GET    | `/metrics`           | Prometheus metrics scraping | Public |
| GET    | `/api/v1/csrf-token` | Generate new CSRF token     | Public |

---

---

## Security Features

The system implements multiple layers of security to protect data and ensuring system integrity:

- **CSRF Protection**: Prevents cross-site request forgery using `csrf-csrf` (Double CSRF pattern). [Learn more about how to use CSRF tokens here](./docs/CSRF.md).
- **Rate Limiting**: Protects against brute-force and DDoS attacks via `express-rate-limit` with Redis storage.
  - **General Limiter**: 60 requests per minute.
  - **Auth Limiter**: 10 attempts per 15 minutes for login/refresh.
  - **Admin Admin Limiter**: applied to Audit and other sensitive admin routes.
- **Role-Based Access Control (RBAC)**: Strict permission checks for `STUDENT`, `ADMIN`, and `SUPER_ADMIN`.
- **Token Blacklisting**: Implemented a Redis-based blacklist to invalidate tokens upon logout or password changes, preventing session hijacking.
- **Dedicated Reset Secret**: Decoupled password reset tokens from access tokens by using a dedicated secret (`RESET_PASSWORD_SECRET`).
- **Metrics Protection**: Secured the Prometheus `/metrics` endpoint with a mandatory API key check.
- **Redirect Validation**: Enforced an allowlist for OAuth redirects to prevent Open Redirect vulnerabilities.
- **Improved Token Security**: Added unique `jti` claims to all JWTs and enforced strict cookie `maxAge` and `path` settings.

---

## Database & Redis

This project requires both a document database and a key-value store:

- **MongoDB**: Used for primary data persistence (Workshops, Users, Enrollments).
- **Redis**: Used for high-speed operations:
  - **Session Management**: Storing user sessions.
  - **OTP Storage**: Temporary storage for verification codes.
  - **Rate Limiting**: Tracking request counts across server instances.
  - **Caching**: Performance optimization for workshop listings.
  - **Background Jobs**: Persistent storage and state management for BullMQ tasks.

---

## Database Models

- **User**: id, name, email, password, role (STUDENT/ADMIN/SUPER_ADMIN), image, isVerified, createdAt, updatedAt
- **Workshop**: title, slug, description, thumbnail, category, level, duration, capacity, enrolledCount, price, prerequisites, schedule, status, createdBy
- **Category**: name, slug, description, image, parentId, isActive
- **Enrollment**: userId, workshopId, status (PENDING/CONFIRMED/CANCELLED), paymentStatus
- **Payment**: enrollmentId, transactionId, amount, currency, paymentMethod, status, responseData
- **Level**: name, order, description

---

## Environment Variables

Create a `.env` file with the following variables:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="mongodb+srv://<DB_USERNAME>:<DB_PASSWORD>@<DB_URL>/skill-workshop-management-system-backend?retryWrites=true&w=majority"

# Security
BCRYPT_SALT_ROUND=10
JWT_ACCESS_SECRET=your_jwt_access_secret_here
JWT_ACCESS_EXPIRES=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_REFRESH_EXPIRES=365d
RESET_PASSWORD_SECRET=your_dedicated_reset_secret_here

# Super Admin
SUPER_ADMIN_EMAIL=<YOUR_SUPER_ADMIN_EMAIL>
SUPER_ADMIN_PASSWORD=<YOUR_SUPER_ADMIN_PASSWORD>

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback

# Session
EXPRESS_SESSION_SECRET=your_session_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Backend URLs (for Swagger, callbacks)
BACKEND_DEV_URL=http://localhost:5000
BACKEND_PROD_URL=https://skill-workshop-management-system-backend.up.railway.app

# Redis (for sessions, rate limiting, OTP)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=

# CSRF
CSRF_SECRET=your_csrf_secret_here_min_32_chars
METRICS_API_KEY=your_metrics_api_key_here

# SSL Commerz Payment
SSL_STORE_ID=your_ssl_store_id
SSL_STORE_PASS=your_ssl_store_password
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
SSL_IPN_URL=http://localhost:5000/api/v1/payment/ipn
SSL_SUCCESS_BACKEND_URL=http://localhost:5000/api/v1/payment/success
SSL_FAIL_BACKEND_URL=http://localhost:5000/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=http://localhost:5000/api/v1/payment/cancel
SSL_SUCCESS_FRONTEND_URL=http://localhost:5173/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:5173/payment/fail
SSL_CANCEL_FRONTEND_URL=http://localhost:5173/payment/cancel

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_app_password
SMTP_PORT=587
SMTP_HOST=smtp.gmail.com
SMTP_FROM=Skill Workshop <your_email@gmail.com>
```

---

## Security

- **JWT Authentication**: Access/refresh token system
- **Password Hashing**: bcryptjs
- **Rate Limiting**: Request throttling
- **CSRF Protection**: Built-in token validation
- **Input Validation**: Zod schema validation
- **NoSQL Injection Prevention**: express-mongo-sanitize
- **Helmet.js**: Security headers
- **HPP Protection**: HTTP Parameter Pollution prevention
- **Structured Logging**: Production-grade monitoring and audit trails via Pino

---

## Scripts

```bash
bun run dev      # Start development server
bun run build    # Build for production
bun run start    # Start production server
bun run lint     # Run ESLint
```

---

## License

This project is licensed under the **MIT License**.

---

## Contact

**Project Lead**: [Tarekul Islam Rifat]  
**Email**: [tarekulrifat142@gmail.com](mailto:tarekulrifat142@gmail.com)
