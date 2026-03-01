"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const env_1 = __importDefault(require("./app/config/env"));
require("./app/config/passport");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const route_1 = __importDefault(require("./app/route"));
const rateLimiter_1 = require("./app/utils/rateLimiter");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
if (env_1.default.EXPRESS_SESSION_SECRET.length < 32) {
    // eslint-disable-next-line no-console
    console.warn("Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.");
}
app.use((0, express_session_1.default)({
    secret: env_1.default.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env_1.default.NODE_ENV === "production",
        httpOnly: true,
        sameSite: env_1.default.NODE_ENV === "production" ? "strict" : "lax",
    },
}));
app.use(passport_1.default.initialize());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: env_1.default.FRONTEND_URL,
    credentials: true,
}));
app.use("/api/v1", rateLimiter_1.generalLimiter, route_1.default);
app.use("/auth", rateLimiter_1.authLimiter);
app.get("/health-check", (_req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Skill Workshop Management System Backend is up and running.",
    });
});
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
