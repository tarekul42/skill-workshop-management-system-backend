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

// ──── Root Route ────
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome to the Skill Workshop Management System API. Please use /api/v1 for API endpoints.",
    documentation: "/api-docs",
  });
});

// ──── Global Error Handler & 404 ────
app.use(globalErrorHandler);
app.use(notFound);

export default app;
