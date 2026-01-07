import express, { Request, Response } from "express";

const app = express();

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

export default app;
