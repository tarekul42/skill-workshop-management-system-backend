# Skill Workshop Management System — Backend Code Review

**Project**: `skill-workshop-management-system-backend`
**Reviewer**: AI Code Reviewer
**Date**: 2026-04-08
**Stack**: TypeScript, Express 5, Mongoose 9, Redis, BullMQ, Bun Runtime
**Files Reviewed**: 87 source files across models, controllers, services, routes, middlewares, utilities, configs, helpers, and jobs.

---

## Executive Summary

This is a well-structured MERN backend for a workshop management system. The project demonstrates good practices in several areas including RBAC, rate limiting, structured logging, audit trails, soft delete, and API versioning. However, the review uncovered **42 issues** across security, architecture, reliability, performance, and code quality that should be addressed. Below is the complete categorized list with severity levels and AI-agent-fixable instructions.

**Severity Legend**: 🔴 Critical | 🟠 High | 🟡 Medium | 🔵 Low

---

## Table of Contents

1. [Security Issues (10)](#1-security-issues)
2. [Architecture & Design Issues (8)](#2-architecture--design-issues)
3. [Reliability & Data Integrity Issues (7)](#3-reliability--data-integrity-issues)
4. [Performance Issues (5)](#4-performance-issues)
5. [Code Quality & Maintainability Issues (7)](#5-code-quality--maintainability-issues)
6. [Configuration & Infrastructure Issues (5)](#6-configuration--infrastructure-issues)

---

## 1. Security Issues

### 1.1 🔴 User Enumeration via Forgot Password and OTP

**File**: `src/app/modules/auth/auth.service.ts` (lines 110-114), `src/app/modules/otp/otp.service.ts` (lines 23-28)

**Problem**: The `forgotPassword` and `sendOtp` endpoints throw explicit errors when a user is not found (`User not found`), not verified, or blocked. This allows attackers to enumerate valid email addresses registered in the system. An attacker can systematically probe the forgot-password endpoint to discover which emails exist, whether they are verified, and whether they are blocked.

**Fix Instruction for AI Agent**:
```
In src/app/modules/auth/auth.service.ts:
- In the forgotPassword function, remove the specific "User not found", "User is not verified", and "User is blocked" checks.
- Replace them with a single response: always send a generic "If an account with this email exists, a reset link has been sent." message.
- Move the user lookup, verification checks, and token generation behind the isUserExists check, and only send the email if the user exists and is active/verified.
- Always return success (200) regardless of whether the user was found or not.

In src/app/modules/otp/otp.service.ts:
- Apply the same pattern to the sendOtp function. Remove the "User not found" and "User already verified" checks before the OTP generation.
- Always return success regardless. Only actually send the OTP if the user exists and is not verified.
- The error for "already verified" should only be returned in the verifyOtp endpoint, not in sendOtp.
```

---

### 1.2 🔴 Access Token Missing Expiry / Cookie Missing MaxAge

**File**: `src/app/utils/setCookie.ts` (lines 12-24)

**Problem**: The access token and refresh token cookies are set without `maxAge` or `expires` options. This means the cookies become **session cookies** that are automatically cleared when the browser closes. While this seems secure, it conflicts with the JWT token expiries set in `userTokens.ts` (where refresh tokens live in Redis for 7 days). More importantly, the access token cookie has no explicit expiry, so the cookie persists even after the JWT inside it has expired, leading to confusing user experience and unnecessary auth failures. Additionally, the `sameSite` is `"lax"` in development, which is fine, but the `secure` flag being `false` in development means cookies are sent over HTTP in local dev.

**Fix Instruction for AI Agent**:
```
In src/app/utils/setCookie.ts:
- Add a maxAge option to both the accessToken and refreshToken cookies.
- For accessToken: set maxAge to match the JWT_ACCESS_EXPIRES value from envVariables (parse it, e.g., "15m" → 900 seconds).
- For refreshToken: set maxAge to 7 * 24 * 60 * 60 (7 days in seconds).
- Add a domain option to restrict cookies to your specific domain.
- Add path: "/" to both cookies.
- Consider adding priority: "high" for better cookie handling in modern browsers.

Create a helper function parseExpiryToSeconds(expiryString: string): number that converts "15m", "7d", "1h" etc. to seconds.
```

---

### 1.3 🟠 No Token Blacklisting on Logout / Password Change

**File**: `src/app/modules/auth/auth.controller.ts` (lines 83-112), `src/app/modules/auth/auth.service.ts` (lines 21-58)

**Problem**: When a user logs out, only the cookies are cleared and the session is destroyed. The access token remains valid until it naturally expires. Similarly, when a user changes or resets their password, the existing access token is not invalidated. An attacker who has stolen an access token can continue using it until its expiry time.

**Fix Instruction for AI Agent**:
```
In src/app/utils/userTokens.ts or a new file src/app/utils/tokenBlacklist.ts:
- Create a tokenBlacklist utility that stores the access token's JTI (or hash) in Redis with an expiry matching the token's remaining TTL.
- Add a function invalidateToken(accessToken: string, secret: string): void that:
  1. Verifies the token.
  2. Stores the token hash in Redis key `blacklist:{tokenHash}` with EX set to the remaining TTL.

In src/app/middlewares/checkAuth.ts:
- After verifying the token, check if it exists in the blacklist.
- If it does, throw an UNAUTHORIZED AppError.

In src/app/modules/auth/auth.controller.ts:
- In the logout function, before clearing cookies, extract the accessToken from req.cookies or req.headers.authorization, and call invalidateToken().
- In auth.service.ts changePassword: after successfully changing the password, invalidate the current token.

In jwt.ts:
- Update generateToken to include a jti (JWT ID) claim using crypto.randomUUID().
```

---

### 1.4 🟠 Password Reset Uses Access Token Secret Instead of Dedicated Secret

**File**: `src/app/modules/auth/auth.service.ts` (line 137)

**Problem**: The `forgotPassword` function signs the reset token using `JWT_ACCESS_SECRET`. This means if the access token secret is compromised, an attacker can forge password reset tokens. Password reset tokens should use a separate, dedicated secret to provide defense-in-depth.

**Fix Instruction for AI Agent**:
```
In src/app/config/env.ts:
- Add a new required environment variable: RESET_PASSWORD_SECRET (string).
- Add it to the requiredEnvVariables array and the IEnvConfig interface.
- Include it in the return object.

In src/app/modules/auth/auth.service.ts:
- In forgotPassword, change jwt.sign() to use envVariables.RESET_PASSWORD_SECRET instead of envVariables.JWT_ACCESS_SECRET.

In src/app/middlewares/checkAuth.ts (or wherever the reset password route is verified):
- Ensure the route uses RESET_PASSWORD_SECRET to verify the token. You may need to create a separate middleware or modify checkAuth to accept different secrets based on the route.
```

---

### 1.5 🟠 Duplicate Auth Providers Allowed Without Enforcement

**File**: `src/app/modules/auth/auth.service.ts` (lines 80-96), `src/app/config/passport.ts` (lines 86-98)

**Problem**: When a user sets a password via `setPassword`, a new `credentials` auth provider is appended to the `auths` array without checking if one already exists. Similarly, if a user registers with email/password and later authenticates via Google, a duplicate Google provider can be added. There is no unique constraint on `auths.provider`.

**Fix Instruction for AI Agent**:
```
In src/app/modules/user/user.model.ts:
- Add a validation on the authProviderSchema or userSchema to ensure unique providers:
  userSchema.path('auths').validate({
    validator: function(auths) {
      const providers = auths.map(a => a.provider);
      return new Set(providers).size === providers.length;
    },
    message: 'Duplicate auth providers are not allowed.'
  });

In src/app/modules/auth/auth.service.ts setPassword:
- The existing hasCredentials check at line 85 already handles this correctly - it doesn't re-add if credentials exist. Verify this is working.
- However, add a similar guard in passport.ts Google strategy: if the user already has a "google" provider, do not add another one.
```

---

### 1.6 🟠 Google OAuth Callback Redirect State Not Validated Against Allowlist

**File**: `src/app/modules/auth/auth.controller.ts` (lines 174-201), `src/app/modules/auth/auth.route.ts` (lines 273-283)

**Problem**: The `googleCallback` function sanitizes the `state` parameter by stripping backslashes and leading slashes, and rejects absolute URLs. However, it does not validate the resulting `redirectTo` value against an allowlist of safe frontend paths. An attacker could craft a state parameter like `../../evil-page` or `..%2F..%2Fevil` that passes the current sanitization but redirects to unintended locations relative to the frontend URL.

**Fix Instruction for AI Agent**:
```
In src/app/modules/auth/auth.controller.ts googleCallback:
- After sanitization, validate the redirectTo value against an allowlist of permitted paths:
  const ALLOWED_REDIRECT_PATHS = ['dashboard', 'profile', 'settings', 'workshops', 'enrollments', 'payments', ''];
- Use path normalization: decode the path, resolve any ../ segments, then check if the normalized path starts with an allowed prefix.
- If the redirectTo path does not match any allowed pattern, default it to '/' or 'dashboard'.
- Example implementation:
  import path from 'path';
  const normalized = path.normalize(`/${redirectTo}`).replace(/^\/+/, '');
  const isAllowed = ALLOWED_REDIRECT_PATHS.some(p => normalized === p || normalized.startsWith(p + '/'));
  if (!isAllowed) redirectTo = '';

In src/app/modules/auth/auth.route.ts:
- In the /google route handler, validate the redirect query parameter before passing it as state.
```

---

### 1.7 🟡 Metrics Endpoint Not Protected by Authentication

**File**: `src/app.ts` (lines 173-183)

**Problem**: The `/metrics` endpoint (Prometheus metrics) is publicly accessible without any authentication. While Prometheus metrics should be scraped by a monitoring server, exposing them publicly leaks internal information about the system: request rates, latencies, error rates, queue depths, Redis memory, and database latency. An attacker can use this information to plan attacks or detect system weaknesses.

**Fix Instruction for AI Agent**:
```
In src/app.ts:
- Add authentication to the /metrics endpoint. You can either:
  Option A: Add an API key check via a custom middleware:
    app.get('/metrics', (req, res, next) => {
      const apiKey = req.headers['x-metrics-key'];
      if (apiKey !== envVariables.METRICS_API_KEY) {
        return res.status(403).end('Forbidden');
      }
      next();
    }, async (_req, res) => { ... });

  Option B: Restrict to internal IPs:
    app.get('/metrics', (req, res, next) => {
      const allowedIPs = ['127.0.0.1', '::1'];
      if (!allowedIPs.includes(req.ip)) return res.status(403).end('Forbidden');
      next();
    }, async (_req, res) => { ... });

In src/app/config/env.ts:
- If using Option A, add METRICS_API_KEY as a required environment variable.
```

---

### 1.8 🟡 Password Reset Link Leaks User ID

**File**: `src/app/modules/auth/auth.service.ts` (line 141)

**Problem**: The password reset URL includes both the user's MongoDB ObjectId (`_id`) and the JWT reset token as query parameters: `?id=${isUserExists._id}&token=${resetToken}`. Exposing the internal database ObjectId is an unnecessary information leak. The JWT token already contains the userId in its payload, so the `_id` parameter is redundant and serves no purpose.

**Fix Instruction for AI Agent**:
```
In src/app/modules/auth/auth.service.ts:
- Remove the _id from the reset link. Change line 141 to:
  const resetUILink = `${envVariables.FRONTEND_URL}/reset-password?token=${resetToken}`;
- The resetPassword function already uses decodedToken.userId (from the JWT), so no frontend changes are needed for the actual reset.
- However, verify that the frontend is not relying on the id parameter and update accordingly.
```

---

### 1.9 🟡 Type Packages in `dependencies` Instead of `devDependencies`

**File**: `package.json` (lines 50-51)

**Problem**: `@types/swagger-jsdoc` and `@types/swagger-ui-express` are listed in `dependencies` instead of `devDependencies`. Type definitions are only needed at compile time and should not be included in production builds, as they increase the production dependency footprint and attack surface unnecessarily.

**Fix Instruction for AI Agent**:
```
In package.json:
- Move `@types/swagger-jsdoc` from dependencies to devDependencies.
- Move `@types/swagger-ui-express` from dependencies to devDependencies.
- Run bun install to update bun.lock.
```

---

### 1.10 🔵 Refresh Token Expiry Hardcoded Instead of Using Env Variable

**File**: `src/app/utils/userTokens.ts` (lines 36, 100)

**Problem**: The refresh token Redis expiry is hardcoded to `7 * 24 * 60 * 60` (7 days in seconds), while the JWT refresh token itself uses `JWT_REFRESH_EXPIRES` from environment variables. If someone changes `JWT_REFRESH_EXPIRES` to a different value (e.g., "30d"), the Redis-stored hash will still expire after 7 days, causing token validation failures.

**Fix Instruction for AI Agent**:
```
In src/app/utils/userTokens.ts:
- Create a helper function parseExpiryToSeconds(expiry: string): number that parses strings like "7d", "15m", "1h" into seconds.
- Replace both hardcoded 7 * 24 * 60 * 60 values with:
  parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES)
- This ensures the Redis TTL always matches the JWT expiry.
```

---

## 2. Architecture & Design Issues

### 2.1 🟠 Audit Controller Not Wrapped in catchAsync

**File**: `src/app/modules/audit/audit.controller.ts`

**Problem**: Unlike all other controllers (user, workshop, category, enrollment, payment, auth, otp, stats), the audit controller's functions are NOT wrapped in `catchAsync`. This means if any async operation inside the audit controller throws an error, it will result in an unhandled promise rejection instead of being caught by the global error handler.

**Fix Instruction for AI Agent**:
```
In src/app/modules/audit/audit.controller.ts:
- Import catchAsync from "../../utils/catchAsync"
- Wrap both getAuditLogs and getAuditLogById with catchAsync:
  const getAuditLogs = catchAsync(async (req: Request, res: Response) => { ... });
  const getAuditLogById = catchAsync(async (req: Request, res: Response) => { ... });
- This ensures any thrown errors are properly forwarded to the global error handler.
```

---

### 2.2 🟠 Duplicate User-Role Authorization Logic Everywhere

**File**: `src/app/middlewares/checkAuth.ts`, `src/app/modules/enrollment/enrollment.service.ts`, `src/app/modules/auth/auth.service.ts`, `src/app/utils/userTokens.ts`

**Problem**: The pattern of checking `userRole === "ADMIN" || userRole === "SUPER_ADMIN"` or `userRole === "ADMIN" && userRole === "SUPER_ADMIN"` is repeated in multiple places: `enrollment.service.ts` (lines 90, 144), `auth.service.ts` ( setPassword line 66), `user.service.ts` (lines 106-108, 195-198), and `userTokens.ts` (lines 67-69). This violates DRY and makes role changes error-prone.

**Fix Instruction for AI Agent**:
```
In src/app/modules/user/user.interface.ts:
- Add helper functions or constants:
  export const isAdminRole = (role: string): boolean => 
    role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  export const isSuperAdmin = (role: string): boolean =>
    role === UserRole.SUPER_ADMIN;
  export const isOwnResourceOrAdmin = (resourceUserId: string, tokenUserId: string, tokenRole: string): boolean =>
    resourceUserId === tokenUserId || isAdminRole(tokenRole);

Then replace all hardcoded role checks across:
- enrollment.service.ts (lines 90, 144)
- user.service.ts (lines 106-108, 195-198)
- userTokens.ts (lines 67-69)
- auth.service.ts setPassword (line 66)

With calls to isAdminRole() and isSuperAdmin().
```

---

### 2.3 🟡 getAllEnrollments Duplicates Pagination Logic from QueryBuilder

**File**: `src/app/modules/enrollment/enrollment.service.ts` (lines 102-136)

**Problem**: The `getAllEnrollments` function manually implements pagination (skip, limit, total, totalPage) instead of using the existing `QueryBuilder` class. Every other getAll method in the project uses `QueryBuilder`. This inconsistency means pagination bugs need to be fixed in multiple places, and the manual implementation lacks NoSQL injection protection, sorting, and field selection that QueryBuilder provides.

**Fix Instruction for AI Agent**:
```
In src/app/modules/enrollment/enrollment.service.ts:
- Replace the manual implementation in getAllEnrollments with:
  const getAllEnrollments = async (query: Record<string, string>) => {
    const queryBuilder = new QueryBuilder(Enrollment.find(), query);
    
    const enrollmentsData = queryBuilder
      .filter()
      .sort()
      .fields()
      .paginate();
    
    const [data, meta] = await Promise.all([
      enrollmentsData.build().populate("user", "name email phone")
        .populate("workshop", "title price images location")
        .populate("payment", "status amount transactionId"),
      queryBuilder.getMeta(),
    ]);
    
    return { data, meta };
  };
- Note: populate() needs to be called after build() since build() returns the query.
- You may need to add a search() call if enrollment search is needed, or just chain filter/sort/fields/paginate.
```

---

### 2.4 🟡 Missing Index on AuditLog's `collectionName` Field

**File**: `src/app/modules/audit/audit.model.ts`, `src/app/modules/audit/audit.service.ts`

**Problem**: The audit log service filters by `collectionName` (e.g., `auditLogger({ collectionName: "User" })` is called throughout the app), and the audit service likely queries by `collectionName` for filtering. However, the audit model only has compound indexes on `(collectionName, action)` and `(collectionName, documentId, action)`. While these compound indexes do cover collectionName queries, if queries ever filter by `collectionName` alone without `action` or `documentId`, the index may not be optimally used. More importantly, there's no index on `performedBy` which is used for filtering logs by user.

**Fix Instruction for AI Agent**:
```
In src/app/modules/audit/audit.model.ts:
- Add a dedicated index on performedBy if the service queries by it:
  auditLogSchema.index({ performedBy: 1, createdAt: -1 });
- Verify that all common query patterns in audit.service.ts are covered by existing compound indexes.
- Consider adding a text index on the `changes` field if full-text search across audit changes is needed.
```

---

### 2.5 🟡 Category Service Uses Dynamic Import

**File**: `src/app/modules/category/category.service.ts` (line 162)

**Problem**: The `deleteCategory` function uses a dynamic `await import("../workshop/workshop.model")` to check for associated workshops. This is an anti-pattern that introduces unnecessary runtime overhead and makes the dependency graph unclear. Static imports should be preferred unless there's a circular dependency issue, in which case the architecture should be refactored.

**Fix Instruction for AI Agent**:
```
In src/app/modules/category/category.service.ts:
- Move the dynamic import to a static import at the top of the file:
  import { WorkShop } from "../workshop/workshop.model";
- Replace line 162: const { WorkShop } = await import(...) with the static import.
- If there was a circular dependency reason for the dynamic import, refactor the architecture to break the cycle. Common solutions include:
  - Creating a shared types/interfaces file.
  - Moving shared logic to a utility or service layer.
  - Using dependency injection.
```

---

### 2.6 🟡 V2 Router is Essentially Empty

**File**: `src/app/route/v2.ts`

**Problem**: The V2 router only has a placeholder health endpoint. The project already has a full API versioning system with header-based and URL-based versioning, deprecation headers, and Sunset headers. However, there's no actual V2 API. The header-based versioning fallback in `api.ts` (line 16-23) means if a client sends `X-API-Version: 2`, they get a nearly empty router instead of a 404 or "not yet available" response.

**Fix Instruction for AI Agent**:
```
In src/app/route/v2.ts:
- Either:
  Option A: Remove the V2 router entirely and add a note in the README that V2 is planned but not yet implemented. Update api.ts to return a proper response for version 2 requests.
  Option B: Add a catch-all route in the V2 router that returns a 501 Not Implemented or a proper message indicating that V2 is under development.
```

---

### 2.7 🟡 Audit Plugin Has a Dead Post-Save Hook

**File**: `src/app/utils/auditPlugin.ts` (lines 61-67)

**Problem**: There's a `schema.post("save", ...)` hook at line 61 that is completely empty — it only contains a comment and no logic. This hook is registered and fires on every document save, consuming resources for no reason. A second, functional `post("save")` hook exists at line 74 which actually performs the audit logging.

**Fix Instruction for AI Agent**:
```
In src/app/utils/auditPlugin.ts:
- Delete the entire first post("save") hook (lines 61-67):
  schema.post("save", async function (doc) {
    if (doc.isNew !== false && doc.$isNew !== false) {
      // $isNew is already false post-save, so we track it via wasNew
    }
    // post-save receives the saved doc; for new docs we log CREATE
    // We use a flag set in pre-save to distinguish create vs update-via-save
  });
- Keep the pre("save") at line 69 and the second post("save") at line 74 as they form the correct working pair.
```

---

### 2.8 🔵 OpenAPI Swagger Documentation Inconsistencies

**File**: `src/app/modules/auth/auth.route.ts` (lines 218-255)

**Problem**: The OpenAPI spec for the `/auth/reset-password` endpoint documents `oldPassword` as a required field in the request body. However, the actual implementation (resetPassword controller/service) only requires `newPassword` — there is no `oldPassword` involved since the user is resetting via a token. This mismatch between documentation and implementation can mislead frontend developers.

**Fix Instruction for AI Agent**:
```
In src/app/modules/auth/auth.route.ts:
- Fix the OpenAPI spec for /auth/reset-password (around line 232):
  - Remove `oldPassword` from the required array.
  - Remove `oldPassword` from the properties.
  - Add `newPassword` as a required property with type string.
  - The corrected schema should be:
    required: ["newPassword"]
    properties:
      newPassword:
        type: string
        description: "New password to set."
```

---

## 3. Reliability & Data Integrity Issues

### 3.1 🔴 Transaction ID Generation Is Not Collision-Safe

**File**: `src/app/utils/getTransactionId.ts`

**Problem**: The transaction ID is generated using `tran_${Date.now()}_${Math.floor(Math.random() * 10000)}`. This format has a collision probability problem: `Date.now()` has millisecond precision (1000 values per second), and `Math.random() * 10000` gives only 10,000 possible suffixes. In a high-traffic scenario, two concurrent requests within the same millisecond have a 1/10,000 chance of generating the same transaction ID. With the payment model having a `unique: true` on `transactionId`, this would cause payment creation to fail intermittently. Also, `Math.random()` is not cryptographically secure.

**Fix Instruction for AI Agent**:
```
In src/app/utils/getTransactionId.ts:
- Replace the entire implementation with a crypto-based approach:
  import crypto from 'crypto';
  
  export const getTransactionId = () => {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(4).toString('hex'); // 8 hex chars = 4 billion combinations
    return `tran_${timestamp}_${random}`;
  };
- This gives ~4 billion combinations per millisecond, making collisions virtually impossible.
```

---

### 3.2 🟠 Cache Invalidation Not Handled on Workshop Update/Delete

**File**: `src/app/modules/workshop/workshop.service.ts` (lines 168-201, 400-413)

**Problem**: The `getAllWorkshops` function caches results in Redis using the key `workshops:list:${JSON.stringify(query)}` with a 60-second TTL. However, when a workshop is updated (`updateWorkshop`) or deleted (`deleteWorkshop`), the cache is not invalidated. This means users can see stale data for up to 60 seconds after changes. More critically, if a workshop's title or slug changes, the cache may serve incorrect slugs for routing.

**Fix Instruction for AI Agent**:
```
In src/app/modules/workshop/workshop.service.ts:
- Add a cache invalidation function:
  const invalidateWorkshopCache = async () => {
    const pattern = 'workshops:list:*';
    const stream = redisClient.scanStream({ match: pattern, count: 100 });
    const keys: string[] = [];
    stream.on('data', (resultKeys: string[]) => keys.push(...resultKeys));
    await new Promise<void>((resolve) => {
      stream.on('end', resolve);
    });
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  };

- Call invalidateWorkshopCache() at the end of:
  - createWorkshop (after auditLogger)
  - updateWorkshop (after auditLogger and Cloudinary cleanup)
  - deleteWorkshop (after auditLogger)

- Alternatively, use a more targeted cache key like `workshops:list` (without the query) and store a single cached version, then invalidate with a single DEL command.
```

---

### 3.3 🟠 Enrollment Capacity Check Has Race Condition

**File**: `src/app/modules/enrollment/enrollment.repository.ts` (lines 66-79)

**Problem**: The workshop capacity check (maxSeats) uses `countDocuments` inside a Mongoose session/transaction. However, MongoDB's default read concern (`local`) for transactions does not guarantee that the count reflects all committed transactions from other concurrent connections. Under high concurrency, two users could both see the count as below maxSeats and both get enrolled, exceeding the workshop capacity.

**Fix Instruction for AI Agent**:
```
In src/app/modules/enrollment/enrollment.repository.ts:
- Change the session options to use snapshot read concern:
  const session = await Enrollment.startSession({
    defaultTransactionOptions: {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    },
  });

- Additionally, add a unique compound index on Enrollment for (workshop, user) with a partial filter on active statuses to prevent duplicate enrollments at the database level:
  In enrollment.model.ts:
    enrollmentSchema.index(
      { workshop: 1, user: 1 },
      { partialFilterExpression: { status: { $in: ['PENDING', 'COMPLETE'] } }, unique: true }
    );
```

---

### 3.4 🟡 Redis Client Error Handling Doesn't Prevent Crashes

**File**: `src/app/config/redis.config.ts` (lines 20-22)

**Problem**: The Redis client has an error event listener that logs the error but doesn't handle it. Redis client errors emitted on the 'error' event will crash the Node.js process if no listener is attached (which is the case here — the listener only logs). More importantly, if Redis goes down temporarily, the application continues to operate but all Redis-dependent features (sessions, rate limiting, caching, OTP) will fail silently.

**Fix Instruction for AI Agent**:
```
In src/app/config/redis.config.ts:
- Enhance the Redis error handler to set a flag and implement reconnection logic:
  let redisHealthy = true;
  redisClient.on('error', (err) => {
    logger.error({ message: 'Redis Client Error', err });
    redisHealthy = false;
  });
  redisClient.on('connect', () => {
    logger.info({ message: 'Redis reconnected' });
    redisHealthy = true;
  });
  export const isRedisHealthy = () => redisHealthy;

- In src/app/middlewares/checkAuth.ts and other Redis-dependent code:
  - Add graceful fallbacks when Redis is unavailable:
    try {
      const storedHashedToken = await redisClient.get(`refresh_token:${userId}`);
    } catch (redisErr) {
      throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, 'Service temporarily unavailable. Please try again.');
    }
```

---

### 3.5 🟡 Soft Delete Plugin Doesn't Override `findOneAndUpdate` Used for Status Changes

**File**: `src/app/utils/softDeletePlugin.ts`, `src/app/modules/enrollment/enrollment.service.ts` (lines 163-170, 210-214)

**Problem**: The soft delete plugin hooks into `findOneAndUpdate` to add `{ isDeleted: { $ne: true } }` filter. However, `enrollment.service.ts` uses `findOneAndUpdate` to change enrollment status (lines 163, 210). The soft delete plugin's pre-hook modifies the query to filter out deleted documents, which is correct. But if an enrollment is soft-deleted and then someone tries to update its status via `findOneAndUpdate`, the query will silently return `null` instead of throwing an error. The service checks for `null` after the update, so this is partially handled, but the user gets a generic "Enrollment not found" instead of "Enrollment has been deleted."

**Fix Instruction for AI Agent**:
```
In src/app/modules/enrollment/enrollment.service.ts:
- In updateEnrollmentStatus and cancelEnrollment:
  - Before calling findOneAndUpdate, explicitly check if the enrollment isDeleted:
    const enrollment = await Enrollment.findById(enrollmentId);
    if (!enrollment) throw new AppError(StatusCodes.NOT_FOUND, 'Enrollment not found');
    if (enrollment.isDeleted) throw new AppError(StatusCodes.GONE, 'Enrollment has been deleted');
  - This gives a more specific error message to the client.

- Alternatively, add this check as a reusable middleware or helper function used across all services that update documents.
```

---

### 3.6 🟡 Payment Success Callback Uses POST but SSLCommerz Sends GET

**File**: `src/app/modules/payment/payment.route.ts` (line 70), `src/app/modules/payment/payment.controller.ts` (lines 23-48)

**Problem**: The payment success route is registered as `router.post("/success", ...)`, but SSLCommerz's default behavior is to redirect the user's browser to the success URL via GET. The route should accept GET requests for the browser redirect and POST for the server-to-server validation. Currently, if SSLCommerz sends a GET redirect to `/api/v1/payment/success?transactionId=...`, Express will return 404.

**Fix Instruction for AI Agent**:
```
In src/app/modules/payment/payment.route.ts:
- Change the success/fail/cancel routes to accept both GET and POST:
  router.route("/success").get(PaymentController.successPayment).post(PaymentController.successPayment);
  router.route("/fail").get(PaymentController.failPayment).post(PaymentController.failPayment);
  router.route("/cancel").get(PaymentController.cancelPayment).post(PaymentController.cancelPayment);

- Update the CSRF exempt paths in src/app/config/csrf.config.ts to include both GET and POST (GET is already ignored by CSRF middleware's ignoredMethods).
```

---

### 3.7 🟡 No Input Length Validation on Workshop Description and Arrays

**File**: `src/app/modules/workshop/workshop.validation.ts` (lines 9, 19-21), `src/app/modules/workshop/workshop.service.ts`

**Problem**: The workshop validation schema allows `description` to be an unbounded string, and arrays like `whatYouLearn`, `prerequisites`, `benefits`, and `syllabus` have no length limits. An attacker could submit a workshop with a 10MB description or arrays with thousands of entries, causing storage bloat and performance degradation in queries and aggregations.

**Fix Instruction for AI Agent**:
```
In src/app/modules/workshop/workshop.validation.ts:
- Add max length constraints:
  description: z.string().max(5000, { message: 'Description cannot exceed 5000 characters' }).optional(),
  whatYouLearn: z.array(z.string().max(200)).max(20, { message: 'Maximum 20 learning outcomes allowed' }).optional(),
  prerequisites: z.array(z.string().max(200)).max(20, { message: 'Maximum 20 prerequisites allowed' }).optional(),
  benefits: z.array(z.string().max(200)).max(20, { message: 'Maximum 20 benefits allowed' }).optional(),
  syllabus: z.array(z.string().max(500)).max(50, { message: 'Maximum 50 syllabus items allowed' }).optional(),
```

---

## 4. Performance Issues

### 4.1 🟡 N+1 Query Pattern in `findUserById` During Enrollment

**File**: `src/app/modules/enrollment/enrollment.repository.ts` (lines 20-22)

**Problem**: `findUserById` queries the User collection within the enrollment transaction. Then `findWorkshopById` queries WorkShop. Then separate queries check for existing enrollments and count documents. That's at least 4 sequential database queries per enrollment creation. While some parallelization is difficult within a transaction, the duplicate enrollment check and capacity check could potentially be combined.

**Fix Instruction for AI Agent**:
```
In src/app/modules/enrollment/enrollment.repository.ts:
- Run the duplicate enrollment check and capacity check in parallel since they are independent reads:
  const [existingEnrollment, currentEnrollmentCount] = await Promise.all([
    Enrollment.findOne({
      user: { $eq: userId },
      workshop: { $eq: workshopId },
      status: { $in: ["PENDING", "COMPLETE"] },
    }).session(session),
    workshop.maxSeats != null
      ? Enrollment.countDocuments({
          workshop: { $eq: workshopId },
          status: { $in: ["PENDING", "COMPLETE"] },
        }).session(session)
      : Promise.resolve(0),
  ]);
- This reduces the sequential query count from 4 to 3 (user + workshop + parallel checks).
```

---

### 4.2 🟡 Aggregation Pipelines in Stats Service Are Unbounded

**File**: `src/app/modules/stats/stats.service.ts` (lines 8-388)

**Problem**: The stats service runs 20+ aggregation pipelines against MongoDB whenever admin stats are requested. These pipelines include lookups, groups, sorts, and limits. On large datasets, these aggregations can be slow and consume significant MongoDB resources. There's no caching layer and no time-range filtering on most queries.

**Fix Instruction for AI Agent**:
```
In src/app/modules/stats/stats.service.ts:
- Add Redis caching with a short TTL (e.g., 5 minutes) for stats:
  import { redisClient } from '../../config/redis.config';
  
  const CACHE_KEY = 'stats:admin';
  const CACHE_TTL = 300; // 5 minutes

  const getStats = async () => {
    const cached = await redisClient.get(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    
    // ... run all aggregations ...
    
    const result = { users, workshops, enrollments, payments };
    await redisClient.set(CACHE_KEY, JSON.stringify(result), { EX: CACHE_TTL });
    return result;
  };

- Alternatively, combine all four stat functions into a single function that returns all stats in one response, and cache the combined result.
- Consider adding $match stages with date range filters to limit the data scanned by aggregations.
```

---

### 4.3 🟡 Sort Parameter in QueryBuilder Is User-Controlled Without Validation

**File**: `src/app/utils/queryBuilder.ts` (lines 56-59)

**Problem**: The `sort()` method directly passes `this.query.sort` to Mongoose's `.sort()` without any validation. While Mongoose generally handles invalid sort values gracefully, a malicious user could potentially pass sort values like `$natural: -1` or sort by fields that shouldn't be sortable (like `password`). More importantly, sorting by non-indexed fields on large collections will cause full collection scans.

**Fix Instruction for AI Agent**:
```
In src/app/utils/queryBuilder.ts:
- Add a whitelist of sortable fields, or at least validate that the sort parameter doesn't contain MongoDB operators:
  sort(): this {
    const sort = this.query.sort || '-createdAt';
    
    // Validate: reject sort values starting with $ or containing dots (nested field attacks)
    const sortFields = sort.split(',').map(s => s.trim());
    const sanitizedSort = sortFields.filter(s => !s.startsWith('$') && !s.includes('.')).join(' ');
    
    this.modelQuery = this.modelQuery.sort(sanitizedSort || '-createdAt');
    return this;
  };
```

---

### 4.4 🔵 Redundant `as string` Type Assertions

**Files**: Multiple controller and service files

**Problem**: Throughout the codebase, there are numerous `as string` type assertions on `req.params.id`, `req.params.slug`, `req.params.paymentId`, and `req.params.enrollmentId`. These are TypeScript assertions that don't provide runtime safety. If Express changes its types or if a param is unexpectedly undefined, the assertion will hide the bug.

**Fix Instruction for AI Agent**:
```
Create a utility function in src/app/utils/parseParams.ts:
  export const parseStringParam = (value: unknown, paramName: string): string => {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new AppError(StatusCodes.BAD_REQUEST, `Invalid ${paramName}`);
    }
    return value;
  };

Then replace all `req.params.id as string` with `parseStringParam(req.params.id, 'id')` across controllers.
```

---

### 4.5 🔵 `allowedFields` Array Has Duplicate Entries for Non-Admin Users

**File**: `src/app/modules/user/user.service.ts` (lines 151-157)

**Problem**: The `allowedFields` array starts with `["name", "password", "phone", "age", "address"]`. Then for non-admin own-profile updates, it pushes `"name", "phone", "age", "address"` again (lines 155-156). These are already in the array from line 151. While this doesn't cause bugs, it's confusing and suggests the logic may not have been carefully considered.

**Fix Instruction for AI Agent**:
```
In src/app/modules/user/user.service.ts updateUser:
- Simplify the allowedFields logic:
  const allowedFields = ['name', 'phone', 'age', 'address'];
  
  if (payload.password !== undefined) {
    sanitizedPayload.password = await bcrypt.hash(payload.password, Number(envVariables.BCRYPT_SALT_ROUND));
  }
  
  if (isAdmin) {
    allowedFields.push('isActive', 'isVerified', 'role');
  }

- Remove the duplicate push and the separate password handling from the loop.
```

---

## 5. Code Quality & Maintainability Issues

### 5.1 🟡 Inconsistent Error Responses — Some Routes Return `data: null`, Others Omit `data`

**Files**: Multiple controllers

**Problem**: Some controllers send `data: null` in the response body for actions like logout, password change, and delete. Others send `data: undefined` (which means the key is omitted from JSON). For example, `logout` sends `data: null` while `deleteUser` returns `null` from the service which is then set as `data: result` where result is `null`. This inconsistency can cause issues on the frontend when checking for the presence of `data`.

**Fix Instruction for AI Agent**:
```
Establish a project-wide convention:
- For operations that don't return data (delete, logout, password change), always send `data: null`.
- For operations that return data, always send `data: <the result>`.
- Ensure all controllers follow this pattern consistently.

Review and fix these controllers:
- user.controller.ts: deleteUser should send data: null explicitly
- auth.controller.ts: logout, changePassword, setPassword, resetPassword should all send data: null
- workshop.controller.ts: deleteLevel, deleteWorkshop should send data: null
- category.controller.ts: deleteCategory should send data: null
- enrollment.controller.ts: updateEnrollmentStatus, cancelEnrollment should send data: null
```

---

### 5.2 🟡 `package.json` Type is `commonjs` But Project Uses Bun with ESM-Style Imports

**File**: `package.json` (line 17), `tsconfig.json`

**Problem**: The package.json declares `"type": "commonjs"` but the project uses Bun runtime which handles both CJS and ESM. The tsconfig.json sets `"module": "commonjs"` and `"noEmit": true` (which is correct for Bun's TypeScript execution). However, the `tsconfig.build.json` is what's used for `bun run build`, and it may not be aligned. This setup works because Bun handles module resolution differently from Node.js, but it could cause confusion for new developers and may break if the project ever migrates to Node.js.

**Fix Instruction for AI Agent**:
```
In package.json:
- If you intend to use Bun exclusively, change "type": "commonjs" to "type": "module" and update imports accordingly.
- If you want to maintain Node.js compatibility, keep "type": "commonjs" but ensure all files use require() syntax in .js outputs.

Read tsconfig.build.json and verify it aligns with the main tsconfig.json.

Best recommendation for a Bun-only project:
- Set "type": "module" in package.json.
- In tsconfig.json, set "module": "ESNext" and "moduleResolution": "Bundler".
- Remove the build script entirely if you only use `bun --watch ./src/server.ts` for development and `bun ./src/server.ts` for production.
```

---

### 5.3 🟡 No `.env.example` File Provided

**File**: Project root

**Problem**: The project requires 40+ environment variables (as seen in `env.ts`), but there's no `.env.example` file in the repository. New developers must read `env.ts` to figure out which variables are needed, their types, and what values to use. This creates a poor developer experience.

**Fix Instruction for AI Agent**:
```
Create a .env.example file at the project root with all required variables:

PORT=5000
NODE_ENV=development
DATABASE_URL=mongodb://localhost:27017/skill-workshop-management-system
BCRYPT_SALT_ROUND=12
JWT_ACCESS_SECRET=your-access-secret-min-32-chars
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
JWT_REFRESH_EXPIRES=7d
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=Admin@123456
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/v1/auth/google/callback
EXPRESS_SESSION_SECRET=your-session-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
BACKEND_DEV_URL=http://localhost:5000
BACKEND_PROD_URL=https://your-domain.com
SSL_STORE_ID=your-ssl-store-id
SSL_STORE_PASS=your-ssl-store-password
SSL_PAYMENT_API=https://sandbox.sslcommerz.com/gwprocess/v4/api.php
SSL_VALIDATION_API=https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php
SSL_IPN_URL=http://localhost:5000/api/v1/payment/ipn
SSL_SUCCESS_BACKEND_URL=http://localhost:5000/api/v1/payment/success
SSL_FAIL_BACKEND_URL=http://localhost:5000/api/v1/payment/fail
SSL_CANCEL_BACKEND_URL=http://localhost:5000/api/v1/payment/cancel
SSL_SUCCESS_FRONTEND_URL=http://localhost:3000/payment/success
SSL_FAIL_FRONTEND_URL=http://localhost:3000/payment/fail
SSL_CANCEL_FRONTEND_URL=http://localhost:3000/payment/cancel
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_USER=your-smtp-user@gmail.com
SMTP_PASS=your-smtp-password
SMTP_PORT=465
SMTP_HOST=smtp.gmail.com
SMTP_FROM=noreply@example.com
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
CSRF_SECRET=your-csrf-secret-min-32-chars

Add .env.example to .gitignore? No, .env.example should be committed. Only .env should be in .gitignore.
```

---

### 5.4 🟡 TypeScript `noEmit: true` in tsconfig.json But Separate `tsconfig.build.json`

**File**: `tsconfig.json` (line 10), `tsconfig.build.json`

**Problem**: The main `tsconfig.json` has `"noEmit": true` which is correct for IDE/development usage with Bun. However, `tsconfig.build.json` is used for `bun run build` which uses `tsc`. This dual-config pattern can lead to configuration drift where the build config doesn't match the development config, causing unexpected type errors at build time that weren't caught during development.

**Fix Instruction for AI Agent**:
```
Read tsconfig.build.json and ensure it extends tsconfig.json with overrides only:
  {
    "extends": "./tsconfig.json",
    "compilerOptions": {
      "noEmit": false,
      "outDir": "./dist",
      "declaration": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist", "tests"]
  }
This ensures build config always inherits from the main config.
```

---

### 5.5 🟡 Logger Uses `message` Key Instead of Pino's `msg` Property

**File**: Multiple files throughout the project

**Problem**: Throughout the codebase, logging is done with `logger.info({ message: "..." })` and `logger.error({ message: "...", err })`. Pino's conventional property for the log message is `msg`, not `message`. Using `message` means the message doesn't appear in Pino's default output format and is treated as a regular stringified property, which degrades log readability in structured logging tools.

**Fix Instruction for AI Agent**:
```
Create a codemod or do a project-wide find-and-replace:
- Replace all logger.info({ message: "..." }) with logger.info({ msg: "..." })
- Replace all logger.error({ message: "..." }) with logger.error({ msg: "..." })
- Replace all logger.warn({ message: "..." }) with logger.warn({ msg: "..." })
- Ensure error objects use `err` key: logger.error({ msg: "...", err })

This applies to ALL files that use logger:
- src/server.ts
- src/app/config/redis.config.ts
- src/app/config/passport.ts
- src/app/modules/workshop/workshop.service.ts
- src/app/modules/workshop/workshop.model.ts
- src/app/modules/category/category.service.ts
- src/app/modules/auth/auth.controller.ts
- src/app/modules/stats/stats.service.ts
- src/app/utils/auditPlugin.ts
- src/app/utils/seedSuperAdmin.ts
- src/app/utils/sendEmail.ts
- src/app/jobs/mail.worker.ts
```

---

### 5.6 🔵 Missing `ts-node-dev` in Scripts

**File**: `package.json` (line 46)

**Problem**: `ts-node-dev` is listed as a devDependency but is never used in any npm script. The dev script uses `bun --watch ./src/server.ts` instead. This is a dead dependency that adds to `node_modules` size.

**Fix Instruction for AI Agent**:
```
In package.json:
- Remove "ts-node-dev": "^2.0.0" from devDependencies.
- Run bun install to update bun.lock.
```

---

### 5.7 🔵 Both `redis` and `ioredis` Packages Are Installed

**File**: `package.json` (lines 69, 86)

**Problem**: Both `ioredis` (^5.10.0) and `redis` (^5.11.0) are installed as dependencies. The project uses `ioredis` for session storage (`connect-redis` works with both, but the code imports from `redis`). Having two Redis clients increases bundle size and can cause confusion. The `redis` client is used in `redis.config.ts` via `import { createClient } from "redis"`, while `ioredis` types are installed but not directly imported anywhere.

**Fix Instruction for AI Agent**:
```
In package.json:
- Verify which Redis client is actually used:
  - If only `redis` (createClient from "redis") is used, remove `ioredis` from dependencies and `@types/ioredis` from devDependencies.
  - If you want to use ioredis (which has better clustering support), refactor redis.config.ts to use ioredis instead.
- Run bun install to update bun.lock after removal.
```

---

## 6. Configuration & Infrastructure Issues

### 6.1 🟠 Docker Production Image Doesn't Set `NODE_OPTIONS` Correctly

**File**: `Dockerfile` (line 15)

**Problem**: The Dockerfile sets `ENV NODE_OPTIONS=--max-old-space-size=1024` but the production stage uses `oven/bun:1-slim` which runs via Bun, not Node.js. `NODE_OPTIONS` is a Node.js environment variable and has no effect when running with Bun. Bun has its own memory management and doesn't respect `NODE_OPTIONS`.

**Fix Instruction for AI Agent**:
```
In Dockerfile:
- Remove the NODE_OPTIONS line since it has no effect with Bun.
- If you need to limit memory for Bun, use Docker's resource limits instead:
  In docker-compose.yml, add to the backend service:
    deploy:
      resources:
        limits:
          memory: 1G
- If you ever switch to Node.js for production, add NODE_OPTIONS back.
```

---

### 6.2 🟡 MongoDB Exposed Port in Docker Compose

**File**: `docker-compose.yml` (line 7)

**Problem**: MongoDB's port is mapped to `27018:27017`, exposing it to the host machine. Redis is similarly mapped to `6379:6379`. In a production deployment, these database ports should NOT be exposed to the host. Only the backend service port (5000) should be exposed. Exposing database ports increases the attack surface.

**Fix Instruction for AI Agent**:
```
In docker-compose.yml:
- Remove or comment out the ports mapping for mongodb and redis services:
  mongodb:
    # ports:
    #   - "27018:27017"
    # Instead, use an internal Docker network (already the default)
  redis:
    # ports:
    #   - "6379:6379"

- The backend service can still access both databases via the Docker network using service names (mongodb:27017 and redis:6379).
- If you need local development access, create a separate docker-compose.override.yml for development that re-enables the ports.
```

---

### 6.3 🟡 Redis Has No Password Authentication in Docker

**File**: `docker-compose.yml`, `src/app/config/redis.config.ts`

**Problem**: The Redis service in Docker Compose has no `command` to enable authentication. Combined with issue 6.2 (exposed port), this means anyone who can reach port 6379 on the host can access Redis without a password. Even if the port is not exposed, it's good practice to set a password.

**Fix Instruction for AI Agent**:
```
In docker-compose.yml:
- Add a password to the Redis service:
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD:-default_redis_password}
    ...

- Update the backend service environment:
  REDIS_PASSWORD: ${REDIS_PASSWORD:-default_redis_password}
```

---

### 6.4 🟡 No Health Check Dependency in Docker Compose for Backend

**File**: `docker-compose.yml`

**Problem**: Both MongoDB and Redis have health checks with `condition: service_healthy`, but the backend service itself has no health check. In a production environment with a reverse proxy (like nginx) or orchestrator (like Kubernetes), the proxy needs to know when the backend is healthy to route traffic.

**Fix Instruction for AI Agent**:
```
In docker-compose.yml:
- Add a health check to the backend service:
  backend:
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5000/api/v1/health/health-check"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
```

---

### 6.5 🔵 `ioredis-mock` in devDependencies but No Tests Found

**File**: `package.json` (line 42)

**Problem**: `ioredis-mock`, `mongodb-memory-server`, and `supertest` are installed as devDependencies, and there's a `test` script (`"test": "bun test tests/"`), but the `tests/` directory doesn't exist in the repository. These dependencies are dead weight without tests.

**Fix Instruction for AI Agent**:
```
Short-term:
- Remove ioredis-mock, mongodb-memory-server, and supertest from devDependencies if no tests exist yet.
- Add a TODO in the README about writing tests.

Long-term:
- Create a tests/ directory with at least integration tests for:
  - Auth flow (login, register, password reset)
  - Enrollment creation with payment
  - Role-based access control
  - Rate limiting
- Use supertest for HTTP assertions and mongodb-memory-server for test database isolation.
```

---

## Summary Table

| # | Severity | Category | Issue | File(s) |
|---|----------|----------|-------|---------|
| 1.1 | 🔴 Critical | Security | User enumeration via forgot-password/OTP | auth.service.ts, otp.service.ts |
| 1.2 | 🔴 Critical | Security | Token cookies missing maxAge | setCookie.ts |
| 1.3 | 🟠 High | Security | No token blacklisting on logout/password change | auth.controller.ts |
| 1.4 | 🟠 High | Security | Password reset uses access token secret | auth.service.ts |
| 1.5 | 🟠 High | Security | Duplicate auth providers allowed | auth.service.ts, passport.ts |
| 1.6 | 🟠 High | Security | OAuth redirect state not validated against allowlist | auth.controller.ts |
| 1.7 | 🟡 Medium | Security | Metrics endpoint unprotected | app.ts |
| 1.8 | 🟡 Medium | Security | Reset link leaks user ID | auth.service.ts |
| 1.9 | 🟡 Medium | Security | Type packages in dependencies | package.json |
| 1.10 | 🔵 Low | Security | Refresh token expiry hardcoded | userTokens.ts |
| 2.1 | 🟠 High | Architecture | Audit controller not wrapped in catchAsync | audit.controller.ts |
| 2.2 | 🟠 High | Architecture | Duplicated role authorization logic | Multiple files |
| 2.3 | 🟡 Medium | Architecture | Manual pagination instead of QueryBuilder | enrollment.service.ts |
| 2.4 | 🟡 Medium | Architecture | Missing audit log indexes | audit.model.ts |
| 2.5 | 🟡 Medium | Architecture | Dynamic import anti-pattern | category.service.ts |
| 2.6 | 🟡 Medium | Architecture | Empty V2 router | route/v2.ts |
| 2.7 | 🟡 Medium | Architecture | Dead audit plugin post-save hook | auditPlugin.ts |
| 2.8 | 🔵 Low | Architecture | OpenAPI spec mismatch for reset-password | auth.route.ts |
| 3.1 | 🔴 Critical | Reliability | Transaction ID collision risk | getTransactionId.ts |
| 3.2 | 🟠 High | Reliability | Workshop cache not invalidated | workshop.service.ts |
| 3.3 | 🟠 High | Reliability | Enrollment capacity race condition | enrollment.repository.ts |
| 3.4 | 🟡 Medium | Reliability | Redis error handling insufficient | redis.config.ts |
| 3.5 | 🟡 Medium | Reliability | Soft delete silent null returns | enrollment.service.ts |
| 3.6 | 🟡 Medium | Reliability | Payment callbacks should accept GET | payment.route.ts |
| 3.7 | 🟡 Medium | Reliability | No input length validation on arrays | workshop.validation.ts |
| 4.1 | 🟡 Medium | Performance | N+1 queries in enrollment | enrollment.repository.ts |
| 4.2 | 🟡 Medium | Performance | Unbounded aggregation in stats | stats.service.ts |
| 4.3 | 🟡 Medium | Performance | Unvalidated sort parameter | queryBuilder.ts |
| 4.4 | 🔵 Low | Performance | Redundant type assertions | Multiple controllers |
| 4.5 | 🔵 Low | Performance | Duplicate allowedFields entries | user.service.ts |
| 5.1 | 🟡 Medium | Code Quality | Inconsistent error response format | Multiple controllers |
| 5.2 | 🟡 Medium | Code Quality | CommonJS type with Bun runtime | package.json |
| 5.3 | 🟡 Medium | Code Quality | No .env.example file | Project root |
| 5.4 | 🟡 Medium | Code Quality | Dual tsconfig pattern | tsconfig.json |
| 5.5 | 🟡 Medium | Code Quality | Wrong Pino log property name | Multiple files |
| 5.6 | 🔵 Low | Code Quality | Dead ts-node-dev dependency | package.json |
| 5.7 | 🔵 Low | Code Quality | Duplicate Redis client packages | package.json |
| 6.1 | 🟠 High | Infrastructure | Docker NODE_OPTIONS ignored by Bun | Dockerfile |
| 6.2 | 🟡 Medium | Infrastructure | Database ports exposed in Docker | docker-compose.yml |
| 6.3 | 🟡 Medium | Infrastructure | Redis no auth in Docker | docker-compose.yml |
| 6.4 | 🟡 Medium | Infrastructure | No backend health check in Docker | docker-compose.yml |
| 6.5 | 🔵 Low | Infrastructure | Test dependencies but no tests | package.json |

---

## What This Project Does Well

Despite the issues above, the project has several notable strengths:

1. **Comprehensive Security Layers**: Helmet, HPP, CSRF (double-submit), rate limiting (Redis-backed), MongoDB sanitization, CORS, session management — a solid defense-in-depth approach.

2. **Structured Audit Logging**: The audit plugin automatically captures all CRUD operations with AsyncLocalStorage for request context (user ID, IP, user agent) — an enterprise-grade pattern.

3. **Graceful Shutdown**: The server.ts implements proper graceful shutdown with resource cleanup order (HTTP server → BullMQ worker → BullMQ queue → Mongoose → Redis) and a force-kill safety timer.

4. **Repository Pattern with Transactions**: The enrollment repository uses Mongoose sessions for atomic enrollment + payment creation — correctly handling rollback on failure.

5. **API Versioning**: Dual versioning strategy (URL + header) with deprecation headers (Sunset) shows forward-thinking API design.

6. **Background Job Processing**: BullMQ with Redis for email processing (password reset, OTP, invoices) with exponential backoff retry — proper async processing.

7. **Soft Delete Pattern**: Well-implemented soft delete plugin with automatic query filtering, aggregate hooks, and TTL-based cleanup considerations.

---

## Recommended Fix Priority

1. **Immediate** (Critical/High): Issues 1.1, 1.2, 1.3, 3.1 — Security and data integrity risks
2. **Short-term** (High): Issues 1.4, 1.5, 1.6, 2.1, 2.2, 3.2, 3.3, 6.1 — Reliability and correctness
3. **Medium-term** (Medium): All remaining Medium issues — Robustness and code quality
4. **Low-priority** (Low): All Low issues — Polish and optimization
