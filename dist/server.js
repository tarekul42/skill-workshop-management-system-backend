"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./app/config/env"));
const redis_config_1 = require("./app/config/redis.config");
const mail_queue_1 = require("./app/jobs/mail.queue");
const mail_worker_1 = require("./app/jobs/mail.worker");
const logger_1 = __importDefault(require("./app/utils/logger"));
const seedSuperAdmin_1 = __importDefault(require("./app/utils/seedSuperAdmin"));
let server;
let isShuttingDown = false;
const SHUTDOWN_TIMEOUT_MS = 15000;
async function gracefulShutdown(exitCode) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger_1.default.info({ message: "Starting graceful shutdown..." });
    // Safety timeout — force-kill if cleanup hangs
    const forceTimer = setTimeout(() => {
        logger_1.default.error({ message: "Shutdown timed out, forcing exit" });
        process.exit(exitCode);
    }, SHUTDOWN_TIMEOUT_MS);
    forceTimer.unref(); // don't keep the event loop alive just for this timer
    try {
        // 1. Stop accepting new connections and drain existing ones
        if (server) {
            if ("closeIdleConnections" in server) {
                server.closeIdleConnections();
            }
            await new Promise((resolve) => server.close(() => resolve()));
            logger_1.default.info({ message: "HTTP server closed" });
        }
        // 2. Close BullMQ worker and queue
        // Close worker first to stop processing new jobs
        await mail_worker_1.mailWorker.close();
        logger_1.default.info({ message: "BullMQ worker closed" });
        // Close queue to release redis connection
        await mail_queue_1.mailQueue.close();
        logger_1.default.info({ message: "BullMQ queue closed" });
        // 3. Close Mongoose connection
        await mongoose_1.default.connection.close();
        logger_1.default.info({ message: "Mongoose connection closed" });
        // 4. Disconnect Redis client
        if (redis_config_1.redisClient && redis_config_1.redisClient.isOpen) {
            await redis_config_1.redisClient.disconnect();
            logger_1.default.info({ message: "Redis connection closed" });
        }
    }
    catch (err) {
        logger_1.default.error({ message: "Error during shutdown cleanup", err });
    }
    process.exit(exitCode);
}
const startServer = async () => {
    try {
        logger_1.default.info({ message: "Connecting to database...." });
        await mongoose_1.default.connect(env_1.default.DATABASE_URL);
        logger_1.default.info({ message: "Connected to Database." });
        server = app_1.default.listen(env_1.default.PORT, () => {
            logger_1.default.info({
                message: `Skill workshop management system backend is running on port: ${env_1.default.PORT}`,
            });
        });
    }
    catch (error) {
        logger_1.default.error({
            message: "Failed to connect to database or start server",
            err: error,
        });
        process.exit(1);
    }
};
(async () => {
    await (0, redis_config_1.connectRedis)();
    await startServer();
    await (0, seedSuperAdmin_1.default)();
})();
process.on("unhandledRejection", (error) => {
    logger_1.default.error({
        message: "Unhandled Rejection Detected. Server shutting down.",
        err: error,
    });
    gracefulShutdown(1);
});
process.on("uncaughtException", (error) => {
    logger_1.default.error({
        message: "Uncaught Exception Detected. Server shutting down.",
        err: error,
    });
    gracefulShutdown(1);
});
process.on("SIGTERM", () => {
    logger_1.default.info({ message: "SIGTERM received. Shutting down gracefully." });
    gracefulShutdown(0);
});
process.on("SIGINT", () => {
    logger_1.default.info({ message: "SIGINT received. Shutting down gracefully." });
    gracefulShutdown(0);
});
