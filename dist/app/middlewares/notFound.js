"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const logger_1 = __importDefault(require("../utils/logger"));
const notFound = (req, res) => {
    logger_1.default.warn({
        message: `Route Not Found: ${req.method} ${req.originalUrl}`,
    });
    res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
        success: false,
        message: "Route Not Found!",
    });
};
exports.default = notFound;
