"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const app_1 = __importDefault(require("./app"));
const env_1 = __importDefault(require("./app/config/env"));
const seedSuperAdmin_1 = __importDefault(require("./app/utils/seedSuperAdmin"));
const redis_config_1 = require("./app/config/redis.config");
const logger_1 = __importDefault(require("./app/utils/logger"));
let server;
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
        logger_1.default.error({ message: "Failed to connect to database or start server", err: error });
        process.exit(1);
    }
};
(async () => {
    await (0, redis_config_1.connectRedis)();
    await startServer();
    await (0, seedSuperAdmin_1.default)();
})();
process.on("unhandledRejection", (error) => {
    logger_1.default.error({ message: "Unhandled Rejection Detected. Server shutting down.", err: error });
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    logger_1.default.error({ message: "Uncaught Exception Detected. Server shutting down.", err: error });
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGTERM", () => {
    logger_1.default.info({ message: "SIGTERM received. Server shutting down." });
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGINT", () => {
    logger_1.default.info({ message: "SIGINT received. Server shutting down." });
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
