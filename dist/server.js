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
let server;
const startServer = async () => {
    try {
        console.log("Connecting to database....");
        await mongoose_1.default.connect(env_1.default.DATABASE_URL);
        console.log("Connected to Database.");
        server = app_1.default.listen(env_1.default.PORT, () => {
            console.log(`Skill workshop management system backend is running on port: ${env_1.default.PORT}`);
        });
    }
    catch (error) {
        console.error("Failed to connect to database or start server:", error);
        process.exit(1);
    }
};
(async () => {
    await (0, redis_config_1.connectRedis)();
    await startServer();
    await (0, seedSuperAdmin_1.default)();
})();
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection Detected. Server shutting down.\n", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception Detected. Server shutting down.\n", error);
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGTERM", () => {
    console.log("SIGTERM received. Server shutting down.");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
process.on("SIGINT", () => {
    console.log("SIGINT received. Server shutting down.");
    if (server) {
        server.close(() => {
            process.exit(1);
        });
    }
    process.exit(1);
});
