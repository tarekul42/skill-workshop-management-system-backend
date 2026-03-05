import type { Server } from "http";
import mongoose from "mongoose";
import app from "./app";
import envVariables from "./app/config/env";
import seedSuperAdmin from "./app/utils/seedSuperAdmin";
import { connectRedis } from "./app/config/redis.config";
import logger from "./app/utils/logger";

let server: Server;

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
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  logger.error({
    message: "Uncaught Exception Detected. Server shutting down.",
    err: error,
  });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info({ message: "SIGTERM received. Server shutting down." });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on("SIGINT", () => {
  logger.info({ message: "SIGINT received. Server shutting down." });
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});
