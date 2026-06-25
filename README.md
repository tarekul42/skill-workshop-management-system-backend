# Skill Workshop Management System — Backend

> A production-ready, highly secure, and scalable Node.js/TypeScript backend for an educational workshop platform. Built with **Bun**, **Express 5**, **MongoDB**, **Redis**, and **BullMQ**. Features RBAC, automated OTP verification, SSLCommerz payments with PDF invoices, Prometheus observability, and a component-based modular architecture across 13 modules.

[![Live API Docs](https://img.shields.io/badge/API_Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://skill-workshop-management-system-backend.up.railway.app/api-docs)
[![Frontend Repo](https://img.shields.io/badge/Frontend_Repo-GitHub-181717?style=flat-square&logo=github&logoColor=white)](https://github.com/tarekul42/skill-workshop-management-system-frontend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📋 Overview

This is the backend infrastructure for the **Skill Workshop Management System** — a platform that bridges industry experts and students through workshops. The API handles authentication (JWT + Google OAuth 2.0), OTP-verified registration, workshop lifecycle management, SSLCommerz payments with PDF invoice generation, enrollment transactions with snapshot isolation, role-based access control, audit trails, and real-time Prometheus metrics.

The codebase follows a **Component-Based Modular Architecture** — each of the 13 modules (`auth`, `user`, `workshop`, `category`, `enrollment`, `otp`, `payment`, `sslCommerz`, `stats`, `review`, `audit`, `contact`, `health`) ships its own interfaces, models, services, controllers, routes, and validations. This keeps the codebase maintainable as it scales.

The backend is deployed on **Railway** with full observability via Prometheus metrics at `/metrics` (API-key protected).

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Bun |
| Framework | Express.js 5 |
| Language | TypeScript 6 |
| Database | MongoDB (Mongoose 9) |
| Cache | Redis 5 |
| Queue | BullMQ (Redis-backed background jobs) |
| Auth | JWT + Passport.js (Local + Google OAuth 2.0) |
| Validation | Zod 4 |
| Logging | Pino + Pino-Pretty |
| File Storage | Cloudinary (multer-storage-cloudinary) |
| Email | Nodemailer |
| Payments | SSLCommerz |
| PDF | pdfkit (invoice generation) |
| Observability | Prometheus (prom-client) |
| API Docs | Swagger/OpenAPI (swagger-ui-express) |
| Security | helmet, hpp, cors, express-rate-limit, csrf-csrf, cookie-parser |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## ✨ Main Features

- **Component-Based Modular Architecture** — 13 self-contained modules, each with its own interfaces → models → services → controllers → routes → validations
- **Multi-modal authentication** — JWT access + refresh token rotation, Google OAuth 2.0, credentials-based login, token blacklisting with `jti` claims
- **Automated OTP system** — Redis-backed OTP for account verification and password resets, with TTL expiry
- **SSLCommerz payment integration** — production-ready payment gateway with transaction logging, IPN validation, success/fail/cancel callbacks, and PDF invoice generation (pdfkit)
- **Snapshot isolation for enrollments** — collision-safe transaction IDs prevent overselling workshops under concurrent enrollment requests
- **Consolidated admin analytics** — single `/api/v1/stats/dashboard` endpoint replaces 7 separate admin calls (6× faster, no client-side N+1 composition)
- **Audit trail system** — real-time logging of all write operations (Create, Update, Delete) with entity-level tracking for accountability
- **Background jobs via BullMQ** — asynchronous processing for emails, PDF generation, and time-consuming tasks
- **Prometheus observability** — `/metrics` endpoint (API-key protected) exposes HTTP traffic, database latency, Redis stats, and BullMQ queue lengths
- **Soft deletes** — data recovery and audit-ready deletion mechanism for core models
- **Rate limiting** — general (60/min), auth (10/15min), admin limiter — all Redis-backed via `rate-limit-redis`
- **CSRF protection** — double-CSRF pattern via `csrf-csrf`
- **Swagger/OpenAPI 3.0 docs** — interactive API documentation at `/api-docs`
- **Docker + Docker Compose** — one-command local setup with MongoDB 7, Redis 7, and the backend

---

## 📦 Main Dependencies

### Runtime Dependencies
| Package | Purpose |
|---------|---------|
| `express@^5.2.1` | Web framework |
| `mongoose@^9.6.2` | MongoDB ODM |
| `redis@^5.12.1` + `connect-redis@^9.0.0` | Redis client + session store |
| `bullmq@^5.77.1` | Background job queue |
| `jsonwebtoken@^9.0.3` | JWT auth |
| `passport@^0.7.0` + `passport-local` + `passport-google-oauth20` | Authentication strategies |
| `bcryptjs@^3.0.3` | Password hashing |
| `zod@^4.4.3` | Schema validation |
| `cloudinary@^2.10.0` + `multer@^2.1.1` + `multer-storage-cloudinary@^4.0.0` | File uploads |
| `nodemailer@^8.0.8` | Transactional emails |
| `pdfkit@^0.17.2` | PDF invoice generation |
| `sslcommerz` (via `axios@^1.16.1`) | Payment gateway integration |
| `prom-client@^15.1.3` | Prometheus metrics |
| `pino@^10.3.1` + `pino-pretty@^13.1.3` | Structured logging |
| `helmet@^8.2.0` + `hpp@^0.2.3` | Security headers + HTTP parameter pollution |
| `express-rate-limit@^8.5.2` + `rate-limit-redis@^4.3.1` | Redis-backed rate limiting |
| `csrf-csrf@^4.0.3` | CSRF protection (double-CSRF) |
| `cookie-parser@^1.4.7` + `express-session@^1.19.0` | Cookies + sessions |
| `swagger-jsdoc@^6.3.0` + `swagger-ui-express@^5.0.1` | API docs |
| `ejs@^4.0.1` | Email template rendering |
| `validator@^13.15.35` | String validation |
| `http-status-codes@^2.3.0` | HTTP status constants |

### Dev Dependencies (key ones)
| Package | Purpose |
|---------|---------|
| `typescript@^6.0.3` | Type safety |
| `eslint@^10.4.0` + `typescript-eslint@^8.59.4` | Linting |
| `supertest@^7.2.2` | HTTP assertion testing |
| `mongodb-memory-server@^11.1.0` | In-memory MongoDB for tests |
| `bun-types@^1.3.14` | Bun type definitions |

---

## 🚀 Run Locally

### Option A: Docker Compose (recommended — one command)

```bash
# 1. Clone
git clone https://github.com/tarekul42/skill-workshop-management-system-backend.git
cd skill-workshop-management-system-backend

# 2. Configure environment
cp .env.example .env
# Edit .env with your values (see table below)

# 3. Start everything (MongoDB + Redis + backend)
bun run docker:up
```

This spins up:
- **MongoDB 7** on port `27020`
- **Redis 7** on port `6379`
- **Backend** on port `5000`

### Option B: Manual setup (without Docker)

#### Prerequisites
- [Bun](https://bun.sh/) 1.x+
- [MongoDB](https://www.mongodb.com/try/download/community) 7+ running locally (or MongoDB Atlas)
- [Redis](https://redis.io/download/) 7+ running locally (or Upstash/Redis Cloud)

#### Steps

```bash
# 1. Clone
git clone https://github.com/tarekul42/skill-workshop-management-system-backend.git
cd skill-workshop-management-system-backend

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
# Edit .env — see required variables below

# 4. Seed the database (creates super admin + demo data)
bun run seed

# 5. Run dev server (with hot reload)
bun run dev
```

Server starts at http://localhost:5000

### Environment Variables (required)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/skill-workshop-management-system` |
| `BCRYPT_SALT_ROUND` | Bcrypt salt rounds | `12` |
| `JWT_ACCESS_SECRET` | Access token secret (min 32 chars) | `openssl rand -base64 32` |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | `openssl rand -base64 32` |
| `SUPER_ADMIN_EMAIL` | Super admin email | `admin@example.com` |
| `SUPER_ADMIN_PASSWORD` | Super admin password | `Admin@123456` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | (from Google Cloud Console) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | (from Google Cloud Console) |
| `EXPRESS_SESSION_SECRET` | Session secret (min 32 chars) | `openssl rand -base64 32` |
| `FRONTEND_URL` | Frontend URL (CORS) | `http://localhost:3000` |
| `SSL_STORE_ID` | SSLCommerz store ID | (from SSLCommerz sandbox) |
| `SSL_STORE_PASS` | SSLCommerz store password | (from SSLCommerz sandbox) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | (from Cloudinary dashboard) |
| `CLOUDINARY_API_KEY` | Cloudinary API key | (from Cloudinary dashboard) |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | (from Cloudinary dashboard) |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `SMTP_USER` | SMTP user | `you@gmail.com` |
| `SMTP_PASS` | SMTP password | (Gmail App Password) |
| `SMTP_PORT` | SMTP port | `465` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CSRF_SECRET` | CSRF secret (min 32 chars) | `openssl rand -base64 32` |
| `RESET_PASSWORD_SECRET` | Reset password secret | `openssl rand -base64 32` |
| `METRICS_API_KEY` | API key for `/metrics` endpoint | `openssl rand -base64 32` |

### Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run build` | TypeScript compile + copy email templates |
| `bun run start` | Start production server from `dist/` |
| `bun run seed` | Seed database with super admin + demo data |
| `bun run seed:fresh` | Fresh seed (drops existing data first) |
| `bun run seed:clear` | Clear all seeded data |
| `bun run lint` | Run ESLint |
| `bun run test` | Run tests with Bun test runner |
| `bun run docker:up` | Start everything via Docker Compose |

---

## 🔗 Links

| Resource | URL |
|----------|-----|
| 📚 **API Docs (Swagger)** | https://skill-workshop-management-system-backend.up.railway.app/api-docs |
| 📊 **Metrics** (API-key protected) | https://skill-workshop-management-system-backend.up.railway.app/metrics |
| 🖥️ **Frontend Repo** | https://github.com/tarekul42/skill-workshop-management-system-frontend |
| 🌐 **Live Frontend** | https://skill-workshop-management-system-frontend.vercel.app |
| 📧 **Contact** | tarekulrifat142@gmail.com |

---

## 📄 License

MIT © Tarekul Islam Rifat

---

<div align="center">

**⭐ If this project helped you, give it a star!**

Built by [Tarekul Islam Rifat](https://github.com/tarekul42)

</div>
