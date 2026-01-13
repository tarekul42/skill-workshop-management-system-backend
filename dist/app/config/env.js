"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const loadEnvVariables = () => {
    const requiredEnvVariables = ["PORT", "NODE_ENV", "DATABASE_URL"];
    requiredEnvVariables.forEach((envVariables) => {
        if (!process.env[envVariables]) {
            throw new Error(`Required environment variable ${envVariables} is not defined`);
        }
    });
    return {
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        DATABASE_URL: process.env.DATABASE_URL,
    };
};
const envVariables = loadEnvVariables();
exports.default = envVariables;
//# sourceMappingURL=env.js.map