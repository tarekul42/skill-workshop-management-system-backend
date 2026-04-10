import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import {
  doubleCsrfProtection,
  generateCsrfToken,
} from "./app/config/csrf.config";
import envVariables from "./app/config/env";
import "./app/config/passport";
import { redisClient } from "./app/config/redis.config";
import { swaggerSpec } from "./app/config/swagger.config";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import mongoSanitize from "./app/middlewares/mongoSanitize";
import notFound from "./app/middlewares/notFound";
import requestLogger from "./app/middlewares/requestLogger";
import apiRouter from "./app/route/api";
import { auditContextMiddleware } from "./app/utils/auditContext";
import logger from "./app/utils/logger";
import {
  httpRequestDurationMicroseconds,
  register,
  updateSystemMetrics,
} from "./app/utils/metrics";
import { generalLimiter } from "./app/utils/rateLimiter";

const app = express();

// ──── Security Check ────
if (envVariables.EXPRESS_SESSION_SECRET.length < 32) {
  logger.warn({
    msg: "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
  });
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
// contentSecurityPolicy is configured to allow swagger-ui-express assets
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://vercel.live",
          "https://cdnjs.cloudflare.com",
        ],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "validator.swagger.io"],
        connectSrc: [
          "'self'",
          "https://vercel.live",
          "https://cdnjs.cloudflare.com",
        ],
        frameSrc: ["'self'", "https://vercel.live"],
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

// ──── Audit Context ────
app.use(auditContextMiddleware);

// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
  res.json(swaggerSpec);
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }", // example refinement
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    customJs: [
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
    ],
  }),
);

// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// Versioned CSRF token endpoint for newer clients (and to support header-based versioning)
app.get("/api/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// ──── API Routes ────
app.use("/api", generalLimiter, apiRouter);

// ──── Metrics Endpoint ────
app.get("/metrics", async (req, res) => {
  const apiKey = req.headers["x-metrics-key"];

  if (apiKey !== envVariables.METRICS_API_KEY) {
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
app.use(globalErrorHandler);
app.use(notFound);

export default app;
