import express, { Request, Response } from "express";

const app = express();

app.get("/", (_req: Request, res: Response) => {
  console.log("Skill workshop management system backend is running.....");
});

export default app;
