import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import envVariables from "./app/config/env";
import { connectRedis, redisClient } from "./app/config/redis.config";
import logger from "./app/utils/logger";
import seedSuperAdmin from "./app/utils/seedSuperAdmin";

let server: Server;
let isShuttingDown = false;

const SHUTDOWN_TIMEOUT_MS = 15_000;

async function gracefulShutdown(exitCode: number) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info({ message: "Starting graceful shutdown..." });

  // Safety timeout — force-kill if cleanup hangs
  const forceTimer = setTimeout(() => {
    logger.error({ message: "Shutdown timed out, forcing exit" });
    process.exit(exitCode);
  }, SHUTDOWN_TIMEOUT_MS);
  forceTimer.unref(); // don't keep the event loop alive just for this timer

  try {
    // 1. Stop accepting new connections and drain existing ones
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      logger.info({ message: "HTTP server closed" });
    }

    // 2. Close Mongoose connection
    await mongoose.connection.close();
    logger.info({ message: "Mongoose connection closed" });

    // 3. Disconnect Redis
    if (redisClient.isOpen) {
      await redisClient.disconnect();
      logger.info({ message: "Redis connection closed" });
    }
  } catch (err) {
    logger.error({ message: "Error during shutdown cleanup", err });
  }

  process.exit(exitCode);
}

const startServer = async () => {
  try {
    logger.info({ message: "Connecting to database...." });
    await mongoose.connect(envVariables.DATABASE_URL);
    logger.info({ message: "Connected to Database." });

    server = app.listen(envVariables.PORT, () => {
      logger.info({
        message: `Skill workshop management system backend is running on port: ${envVariables.PORT}`,
      });
    });
  } catch (error) {
    logger.error({
      message: "Failed to connect to database or start server",
      err: error,
    });
    process.exit(1);
  }
};

(async () => {
  await connectRedis();
  await startServer();
  await seedSuperAdmin();
})();

process.on("unhandledRejection", (error) => {
  logger.error({
    message: "Unhandled Rejection Detected. Server shutting down.",
    err: error,
  });
  gracefulShutdown(1);
});

process.on("uncaughtException", (error) => {
  logger.error({
    message: "Uncaught Exception Detected. Server shutting down.",
    err: error,
  });
  gracefulShutdown(1);
});

process.on("SIGTERM", () => {
  logger.info({ message: "SIGTERM received. Shutting down gracefully." });
  gracefulShutdown(0);
});

process.on("SIGINT", () => {
  logger.info({ message: "SIGINT received. Shutting down gracefully." });
  gracefulShutdown(0);
});
