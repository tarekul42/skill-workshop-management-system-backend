import express, { Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/route";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { generalLimiter } from "./app/utils/rateLimiter";

const app = express();

app.use(express.json());
app.use(cors());
app.use(cookieParser());

app.use("/api/v1", generalLimiter, router);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
