import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "./app/middlewares/mongoSanitize";
import morgan from "morgan";
import passport from "passport";
import envVariables from "./app/config/env";
import "./app/config/passport";
import {
  doubleCsrfProtection,
  generateCsrfToken,
} from "./app/config/csrf.config";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/route";
import { authLimiter, generalLimiter } from "./app/utils/rateLimiter";
import logger from "./app/utils/logger";
import { RedisStore } from "connect-redis";
import { redisClient } from "./app/config/redis.config";
import { swaggerSpec } from "./app/config/swagger.config";
import swaggerUi from "swagger-ui-express";

const app = express();

// ──── Security Check ────
if (envVariables.EXPRESS_SESSION_SECRET.length < 32) {
  logger.warn({
    message:
      "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
  });
}

// ──── HTTP Request Logger ────
app.use(morgan(envVariables.NODE_ENV === "production" ? "tiny" : "dev"));

// ──── Request Debugger ────
app.use((req, _res, next) => {
  logger.info({
    message: `Incoming Request: ${req.method} ${req.originalUrl}`,
  });
  next();
});

// ──── Security Headers ────
// contentSecurityPolicy is configured to allow swagger-ui-express assets
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: ["'self'"],
      },
    },
  }),
);

app.set("trust proxy", 1);

// ──── CORS ────
app.use(
  cors({
    origin: envVariables.FRONTEND_URL,
    credentials: true,
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
      sameSite: envVariables.NODE_ENV === "production" ? "strict" : "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }),
);
app.use(passport.initialize());

// ──── CSRF Protection ────
app.use(doubleCsrfProtection);


// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// ──── API Routes ────
app.use("/api/v1", generalLimiter, router);
app.use("/auth", authLimiter);

/**
 * @openapi
 * tags:
 *   name: Health
 *   description: Health and status endpoints
 */

/**
 * @openapi
 * /:
 *   get:
 *     summary: Root endpoint
 *     description: Check if the backend is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend is up and running.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Skill Workshop Management System Backend is up and running."
 */
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

/**
 * @openapi
 * /ping:
 *   get:
 *     summary: Ping endpoint
 *     description: Simple health ping, returns pong.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Pong
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: pong
 */
app.get("/ping", (_req, res) => {
  res.json({ message: "pong" });
});

/**
 * @openapi
 * /check-version:
 *   get:
 *     summary: Check version
 *     description: Returns API version and server status.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 message:
 *                   type: string
 *                   example: Server is running.
 */
app.get("/check-version", (_req: Request, res: Response) => {
  res.json({
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    message: "Server is running.",
  });
});

/**
 * @openapi
 * /health-check:
 *   get:
 *     summary: Health check
 *     description: Returns server health status and uptime.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   description: Process uptime in seconds
 */
app.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ──── Global Error Handler & 404 ────
app.use(globalErrorHandler);
app.use(notFound);

export default app;
