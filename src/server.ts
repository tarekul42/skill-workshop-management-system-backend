import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app.js";
import envVariables from "./app/config/env.js";
import { connectRedis, redisClient } from "./app/config/redis.config.js";
import { mailQueue } from "./app/jobs/mail.queue.js";
import logger from "./app/utils/logger.js";
import seedSuperAdmin from "./app/utils/seedSuperAdmin.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

let server: Server;
let isShuttingDown = false;

const SHUTDOWN_TIMEOUT_MS = 15_000;
const MAX_PORT_RETRIES = 20;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT_FILE = path.resolve(__dirname, "../.port");

export let ACTUAL_PORT: number | null = null;

function writePortFile(port: number) {
  try {
    fs.writeFileSync(PORT_FILE, String(port), "utf-8");
  } catch {
    // non-critical
  }
}

async function gracefulShutdown(exitCode: number) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ msg: "Starting graceful shutdown..." });

  const forceTimer = setTimeout(() => {
    logger.error({ msg: "Shutdown timed out, forcing exit" });
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref();

  try {
    if (server) {
      if ("closeIdleConnections" in server) {
        (server as { closeIdleConnections: () => void }).closeIdleConnections();
      }
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info({ msg: "HTTP server closed" });
    }

    if (process.env.RUN_WORKER === "true") {
      const { mailWorker } = await import("./app/jobs/mail.worker.js");
      await mailWorker.close();
      logger.info({ msg: "BullMQ worker closed" });
    }

    await mailQueue.close();
    logger.info({ msg: "BullMQ queue closed" });

    await mongoose.connection.close();
    logger.info({ msg: "Mongoose connection closed" });

    if (redisClient && redisClient.isOpen) {
      await redisClient.disconnect();
      logger.info({ msg: "Redis connection closed" });
    }
  } catch (err) {
    logger.error({ msg: "Error during shutdown cleanup", err });
  }

  process.exit(exitCode);
}

function tryListen(port: number, maxRetries = MAX_PORT_RETRIES): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = app.listen(port);

    s.on("listening", () => {
      server = s;
      ACTUAL_PORT = port;
      process.env.ACTUAL_PORT = String(port);
      writePortFile(port);
      logger.info({
        msg: `Skill workshop management system backend is running on port: ${port}`,
      });
      resolve();
    });

    s.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        const attempts = port - Number(envVariables.PORT);
        if (attempts >= maxRetries) {
          logger.error({
            msg: `Exhausted ${maxRetries} fallback ports. Last tried port ${port}.`,
          });
          reject(new Error(`No available port found after ${maxRetries} attempts`));
          return;
        }
        logger.warn({
          msg: `Port ${port} is in use, trying port ${port + 1}`,
        });
        s.close(() => {
          tryListen(port + 1, maxRetries).then(resolve, reject);
        });
      } else {
        reject(error);
      }
    });
  });
}

const startServer = async () => {
  try {
    logger.info({ msg: "Connecting to database...." });
    await mongoose.connect(envVariables.DATABASE_URL);
    logger.info({ msg: "Connected to Database." });
  } catch (error) {
    logger.error({
      msg: "Failed to connect to database",
      err: error,
    });
    process.exit(1);
  }

  try {
    await tryListen(Number(envVariables.PORT));
  } catch (error) {
    logger.error({ msg: "Failed to start server", err: error });
    process.exit(1);
  }
};

(async () => {
  try {
    await connectRedis();
  } catch (error) {
    logger.error({
      msg: "Failed to connect to Redis — required for sessions, rate limiting, and auth",
      err: error,
    });
    process.exit(1);
  }
  await startServer();
  await seedSuperAdmin();

  if (process.env.RUN_WORKER === "true") {
    await import("./app/jobs/mail.worker.js");
    logger.info({ msg: "BullMQ worker initialized (RUN_WORKER=true)" });
  }
})();

process.on("unhandledRejection", (error) => {
  logger.error({
    msg: "Unhandled Rejection Detected. Server shutting down.",
    err: error,
  });
  gracefulShutdown(1);
});

process.on("uncaughtException", (error) => {
  logger.error({
    msg: "Uncaught Exception Detected. Server shutting down.",
    err: error,
  });
  gracefulShutdown(1);
});

process.on("SIGTERM", () => {
  logger.info({ msg: "SIGTERM received. Shutting down gracefully." });
  gracefulShutdown(0);
});

process.on("SIGINT", () => {
  logger.info({ msg: "SIGINT received. Shutting down gracefully." });
  gracefulShutdown(0);
});
