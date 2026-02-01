import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/route";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { generalLimiter } from "./app/utils/rateLimiter";
import expressSession from "express-session";
import envVariables from "./app/config/env";
import passport from "passport";
import "./app/config/passport";

const app = express();

app.use(
  expressSession({
    secret: envVariables.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.use(cors());

app.use("/api/v1", generalLimiter, router);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
