import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import passport from "passport";
import envVariables from "./app/config/env";
import "./app/config/passport";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/route";
import { authLimiter, generalLimiter } from "./app/utils/rateLimiter";

const app = express();

app.set("trust proxy", 1);

if (envVariables.EXPRESS_SESSION_SECRET.length < 32) {
  // eslint-disable-next-line no-console
  console.warn(
    "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
  );
}

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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: envVariables.FRONTEND_URL,
    credentials: true,
  }),
);

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
