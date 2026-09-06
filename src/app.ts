import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import crypto from "crypto";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import {
  doubleCsrfProtection,
  generateCsrfToken,
} from "./app/config/csrf.config.js";
import envVariables from "./app/config/env.js";
import "./app/config/passport.js";
import { redisClient } from "./app/config/redis.config.js";
import { swaggerSpec } from "./app/config/swagger.config.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";
import mongoSanitize from "./app/middlewares/mongoSanitize.js";
import notFound from "./app/middlewares/notFound.js";
import requestLogger from "./app/middlewares/requestLogger.js";
import apiRouter from "./app/route/api.js";
import { auditContextMiddleware } from "./app/utils/auditContext.js";
import logger from "./app/utils/logger.js";
import {
  httpRequestDurationMicroseconds,
  register,
  updateSystemMetrics,
} from "./app/utils/metrics.js";
import { authLimiter, generalLimiter, metricsLimiter } from "./app/utils/rateLimiter.js";

const app = express();
app.disable("x-powered-by");

// ──── Security Check ────
const requiredSecrets = [
  {
    name: "EXPRESS_SESSION_SECRET",
    value: envVariables.EXPRESS_SESSION_SECRET,
  },
  { name: "JWT_ACCESS_SECRET", value: envVariables.JWT_ACCESS_SECRET },
  { name: "JWT_REFRESH_SECRET", value: envVariables.JWT_REFRESH_SECRET },
  { name: "CSRF_SECRET", value: envVariables.CSRF_SECRET },
  { name: "RESET_PASSWORD_SECRET", value: envVariables.RESET_PASSWORD_SECRET },
];

const MIN_SECRET_LENGTH = 32;

const PLACEHOLDER_PATTERNS = [
  /^change-me/i,
  /your-.*(secret|key|password)/i,
  /placeholder/i,
  /dummy/i,
  /^(secret|password|token)$/i,
  /^(.)\1{7,}$/,
];

// In test mode the gate is noise — tests use mock secrets.
if (envVariables.NODE_ENV !== "test") {
  if (envVariables.NODE_ENV === "production") {
    const distinctSecrets = new Set(requiredSecrets.map((s) => s.value));
    if (distinctSecrets.size !== requiredSecrets.length) {
      throw new Error(
        "Security check failed: secret values must be unique. " +
          "Reusing a secret across purposes (e.g. access vs refresh tokens) undermines isolation.",
      );
    }
  }

  for (const secret of requiredSecrets) {
    if (!secret.value || secret.value.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `${secret.name} must be at least ${MIN_SECRET_LENGTH} characters (use a high-entropy random value, e.g. 'openssl rand -hex 32'). ` +
          `Current length: ${secret.value.length}`,
      );
    }
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.test(secret.value)) {
        throw new Error(
          `${secret.name} appears to be a placeholder/default value. Generate a real secret with 'openssl rand -hex 32'.`,
        );
      }
    }
  }
}

// ──── HTTP Request Logger ────
app.use(requestLogger);

// ──── Metrics Middleware ────
app.use((req, res, next) => {
  const start = process.hrtime();
  res.on("finish", () => {
    const durationInSeconds =
      process.hrtime(start)[0] + process.hrtime(start)[1] / 1e9;

    // Use req.route.path if available (matched express route)
    // Otherwise use a generic label to prevent cardinality explosion DoS
    const route = req.route ? req.route.path : "(unmatched)";

    httpRequestDurationMicroseconds.observe(
      {
        method: req.method,
        route,
        status_code: res.statusCode,
      },
      durationInSeconds,
    );
  });
  next();
});

// ──── Security Headers ────
// HSTS: enabled in development + production (any real deployment).
// Disabled in test mode to avoid interfering with local HTTP testing.
// CSP: minimal policy for API-only backend (no inline scripts, no frames).
// Frontend CSP is managed by Vercel separately.
const isLocalEnv = envVariables.NODE_ENV === "test";
const helmetOptions = {
  hsts: isLocalEnv
    ? false
    : {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
      formAction: ["'none'"],
    },
  },
};

app.use(helmet(helmetOptions));

app.set("trust proxy", 1);

// ──── CORS ────
const allowedOrigins = envVariables.FRONTEND_URL.split(",").map((s) =>
  s.trim(),
);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "x-csrf-token",
      "X-CSRF-Token",
    ],
  }),
);

// ──── Body Parsers ────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ──── Cookie Parser ────
app.use(cookieParser());

// ──── Input Sanitization ────
app.use(mongoSanitize); // strip $ and . from req.body/query/params
app.use(hpp()); // prevent HTTP parameter pollution

// ──── Session & Auth ────
app.use(
  expressSession({
    store: new RedisStore({ client: redisClient }),
    secret: envVariables.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envVariables.NODE_ENV === "production",
      httpOnly: true,
      sameSite: envVariables.COOKIE_SAMESITE,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);
app.use(passport.initialize());

// ──── CSRF Protection ────
app.use(doubleCsrfProtection);

// ──── Audit Context ────
app.use(auditContextMiddleware);

// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

if (envVariables.NODE_ENV !== "production") {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
    }),
  );
} else {
  app.get("/api-docs", (_req, res) => {
    res
      .status(404)
      .json({ message: "API documentation is not available in production" });
  });
}

// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", authLimiter, (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// Versioned CSRF token endpoint for newer clients (and to support header-based versioning)
app.get("/api/csrf-token", authLimiter, (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// ──── API Routes ────
app.use("/api", generalLimiter, apiRouter);

// ──── Metrics Endpoint ────
// Exposes Prometheus-compatible metrics for monitoring.
// Protected by: API key (timing-safe comparison), rate limiting (10 req/min).
//
// Exposed metrics:
//   - http_request_duration_seconds: HTTP request latency histogram (method, route, status_code)
//   - redis_used_memory_bytes: Redis memory consumption
//   - db_connection_latency_ms: MongoDB ping latency
//   - mail_queue_jobs_total: BullMQ mail queue depth
//   - Default prom-client metrics (process CPU, memory, GC, event loop lag)
//
// Route labels are pre-aggregated to prevent high-cardinality explosion.
// No user-identifying or payment-sensitive data is included.
app.get("/metrics", metricsLimiter, async (req, res) => {
  const apiKey = req.headers["x-metrics-key"];

  if (!apiKey || typeof apiKey !== "string") {
    return res.status(403).end("Forbidden");
  }

  const expectedKey = envVariables.METRICS_API_KEY;
  const expectedBuf = Buffer.from(expectedKey, "utf8");
  const receivedBuf = Buffer.from(apiKey, "utf8");

  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return res.status(403).end("Forbidden");
  }

  try {
    await updateSystemMetrics();
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (ex: unknown) {
    logger.error({ msg: "Error while collecting metrics", err: ex });
    res.status(500).end("Internal server error");
  }
});

// ──── Root Route ────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Skill Workshop Management System Backend!",
  });
});

// ──── Global Error Handler & 404 ────
app.use(notFound);
app.use(globalErrorHandler);

export default app;
