import express, { Request, Response } from "express";
import { UserRoutes } from "./app/modules/user/user.routes";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/v1/user", UserRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

export default app;
