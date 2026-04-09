import mongoose from "mongoose";
import app from "./app";
import envVariables from "./app/config/env";
import { connectRedis, redisClient } from "./app/config/redis.config";
import { mailQueue } from "./app/jobs/mail.queue";
import { mailWorker } from "./app/jobs/mail.worker";
import logger from "./app/utils/logger";
import seedSuperAdmin from "./app/utils/seedSuperAdmin";
let server;
let isShuttingDown = false;
const SHUTDOWN_TIMEOUT_MS = 15000;
async function gracefulShutdown(exitCode) {
    if (isShuttingDown)
        return;
    isShuttingDown = true;
    logger.info({ msg: "Starting graceful shutdown..." });
    // Safety timeout — force-kill if cleanup hangs
    const forceTimer = setTimeout(() => {
        logger.error({ msg: "Shutdown timed out, forcing exit" });
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
            logger.info({ msg: "HTTP server closed" });
        }
        // 2. Close BullMQ worker and queue
        // Close worker first to stop processing new jobs
        await mailWorker.close();
        logger.info({ msg: "BullMQ worker closed" });
        // Close queue to release redis connection
        await mailQueue.close();
        logger.info({ msg: "BullMQ queue closed" });
        // 3. Close Mongoose connection
        await mongoose.connection.close();
        logger.info({ msg: "Mongoose connection closed" });
        // 4. Disconnect Redis client
        if (redisClient && redisClient.isOpen) {
            await redisClient.disconnect();
            logger.info({ msg: "Redis connection closed" });
        }
    }
    catch (err) {
        logger.error({ msg: "Error during shutdown cleanup", err });
    }
    process.exit(exitCode);
}
const startServer = async () => {
    try {
        logger.info({ msg: "Connecting to database...." });
        await mongoose.connect(envVariables.DATABASE_URL);
        logger.info({ msg: "Connected to Database." });
        server = app.listen(envVariables.PORT, () => {
            logger.info({ msg: `Skill workshop management system backend is running on port: ${envVariables.PORT}`,
            });
        });
    }
    catch (error) {
        logger.error({ msg: "Failed to connect to database or start server",
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
    logger.error({ msg: "Unhandled Rejection Detected. Server shutting down.",
        err: error,
    });
    gracefulShutdown(1);
});
process.on("uncaughtException", (error) => {
    logger.error({ msg: "Uncaught Exception Detected. Server shutting down.",
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
