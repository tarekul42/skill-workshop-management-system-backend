import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
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

const app = express();

if (envVariables.EXPRESS_SESSION_SECRET.length < 32) {
  logger.warn({
    message:
      "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
  });
}

// ──── Security Headers ────
app.use(helmet());

// ──── HTTP Request Logger ────
app.use(morgan(envVariables.NODE_ENV === "production" ? "combined" : "dev"));

// ──── Body Parsers ────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// ──── Input Sanitization ────
app.use(mongoSanitize()); // strip $ and . from req.body/query/params
app.use(hpp()); // prevent HTTP parameter pollution

// ──── Session & Auth ────
app.use(
  expressSession({
    secret: envVariables.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: envVariables.NODE_ENV === "production",
      httpOnly: true,
      sameSite: envVariables.NODE_ENV === "production" ? "strict" : "lax",
    },
  }),
);
app.use(passport.initialize());
app.use(cookieParser());

// ──── CORS ────
app.use(
  cors({
    origin: envVariables.FRONTEND_URL,
    credentials: true,
  }),
);

app.set("trust proxy", 1);

// ──── CSRF Protection ────
app.use(doubleCsrfProtection);

// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.status(200).json({ csrfToken: token });
});

// ──── Routes ────
app.use("/api/v1", generalLimiter, router);

app.use("/auth", authLimiter);

app.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;

