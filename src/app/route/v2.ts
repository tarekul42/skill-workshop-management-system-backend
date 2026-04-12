import express, { Request, Response } from "express";

const router = express.Router();

// Example v2 endpoint(s). Use this router to introduce breaking changes safely.
router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
    apiVersion: 2,
  });
});

// V2 is under development — all other routes return 501 Not Implemented
router.use((_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message:
      "API v2 is not yet implemented. Please use /api/v1 or the default version.",
    apiVersion: 2,
  });
});

export default router;
