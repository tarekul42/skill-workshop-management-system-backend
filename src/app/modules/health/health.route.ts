import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { redisClient } from "../../config/redis.config";
import { mailQueue } from "../../jobs/mail.queue";

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

/**
 * @openapi
 * /health/dashboard:
 *   get:
 *     summary: Advanced health dashboard
 *     description: >
 *       Returns detailed health information including Redis memory usage,
 *       database connection latency, and mail queue length.
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 */
router.get("/dashboard", async (_req: Request, res: Response) => {
  const startedAt = Date.now();

  let redisMemoryBytes: number | null = null;
  let dbLatencyMs: number | null = null;
  let queueLength: number | null;

  // Redis memory usage
  try {
    if (redisClient.isOpen) {
      const info = await redisClient.info("memory");
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        redisMemoryBytes = Number(match[1]);
      }
    }
  } catch {
    redisMemoryBytes = null;
  }

  // DB connection latency
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const start = process.hrtime();
      await mongoose.connection.db.admin().ping();
      const diff = process.hrtime(start);
      dbLatencyMs = diff[0] * 1000 + diff[1] / 1e6;
    }
  } catch {
    dbLatencyMs = null;
  }

  // Queue length
  try {
    const [waiting, active, delayed, failed] = await Promise.all([
      mailQueue.getWaitingCount(),
      mailQueue.getActiveCount(),
      mailQueue.getDelayedCount(),
      mailQueue.getFailedCount(),
    ]);

    queueLength =
      (waiting ?? 0) + (active ?? 0) + (delayed ?? 0) + (failed ?? 0);
  } catch {
    queueLength = null;
  }

  const overallStatus =
    redisMemoryBytes !== null && dbLatencyMs !== null && queueLength !== null
      ? "healthy"
      : "degraded";

  res.status(200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: Date.now() - startedAt,
    redis: {
      memoryBytes: redisMemoryBytes,
      connected: redisClient.isOpen,
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      latencyMs: dbLatencyMs,
    },
    queue: {
      name: mailQueue.name,
      length: queueLength,
    },
  });
});

export const HealthRoutes = router;
