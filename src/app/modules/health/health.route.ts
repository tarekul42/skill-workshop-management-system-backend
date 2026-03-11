import express, { Request, Response } from "express";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Health
 *   description: Health and status endpoints
 */

/**
 * @openapi
 * /health/:
 *   get:
 *     summary: Root endpoint
 *     description: Check if the backend is running.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Backend is up and running.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 */
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    message: "Skill Workshop Management System Backend is up and running.",
  });
});

/**
 * @openapi
 * /health/ping:
 *   get:
 *     summary: Ping endpoint
 *     description: Simple health ping, returns pong.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Pong
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 */
router.get("/ping", (_req, res) => {
  res.json({ message: "pong" });
});

/**
 * @openapi
 * /health/check-version:
 *   get:
 *     summary: Check version
 *     description: Returns API version and server status.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Version info
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 */
router.get("/check-version", (_req: Request, res: Response) => {
  res.json({
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    message: "Server is running.",
  });
});

/**
 * @openapi
 * /health/health-check:
 *   get:
 *     summary: Health check
 *     description: Returns server health status and uptime.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 */
router.get("/health-check", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export const HealthRoutes = router;
