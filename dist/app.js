"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const mongoSanitize_1 = __importDefault(require("./app/middlewares/mongoSanitize"));
const morgan_1 = __importDefault(require("morgan"));
const passport_1 = __importDefault(require("passport"));
const env_1 = __importDefault(require("./app/config/env"));
require("./app/config/passport");
const csrf_config_1 = require("./app/config/csrf.config");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const route_1 = __importDefault(require("./app/route"));
const rateLimiter_1 = require("./app/utils/rateLimiter");
const logger_1 = __importDefault(require("./app/utils/logger"));
const connect_redis_1 = require("connect-redis");
const redis_config_1 = require("./app/config/redis.config");
const swagger_config_1 = require("./app/config/swagger.config");
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const app = (0, express_1.default)();
// ──── Security Check ────
if (env_1.default.EXPRESS_SESSION_SECRET.length < 32) {
    logger_1.default.warn({
        message: "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
    });
}
// ──── HTTP Request Logger ────
app.use((0, morgan_1.default)(env_1.default.NODE_ENV === "production" ? "tiny" : "dev"));
// ──── Request Debugger ────
app.use((req, _res, next) => {
    logger_1.default.info({
        message: `Incoming Request: ${req.method} ${req.originalUrl}`,
    });
    next();
});
// ──── Security Headers ────
// contentSecurityPolicy is configured to allow swagger-ui-express assets
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "validator.swagger.io"],
            connectSrc: ["'self'"],
        },
    },
}));
app.set("trust proxy", 1);
// ──── CORS ────
app.use((0, cors_1.default)({
    origin: env_1.default.FRONTEND_URL,
    credentials: true,
}));
// ──── Body Parsers ────
app.use(express_1.default.json({ limit: "16kb" }));
app.use(express_1.default.urlencoded({ extended: true, limit: "16kb" }));
// ──── Cookie Parser ────
app.use((0, cookie_parser_1.default)());
// ──── Input Sanitization ────
app.use(mongoSanitize_1.default); // strip $ and . from req.body/query/params
app.use((0, hpp_1.default)()); // prevent HTTP parameter pollution
// ──── Session & Auth ────
app.use((0, express_session_1.default)({
    store: new connect_redis_1.RedisStore({ client: redis_config_1.redisClient }),
    secret: env_1.default.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: env_1.default.NODE_ENV === "production",
        httpOnly: true,
        sameSite: env_1.default.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
app.use(passport_1.default.initialize());
// ──── CSRF Protection ────
app.use(csrf_config_1.doubleCsrfProtection);
// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
    res.json(swagger_config_1.swaggerSpec);
});
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec));
// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req, res) => {
    const token = (0, csrf_config_1.generateCsrfToken)(req, res);
    res.status(200).json({ csrfToken: token });
});
// ──── API Routes ────
app.use("/api/v1", rateLimiter_1.generalLimiter, route_1.default);
app.use("/auth", rateLimiter_1.authLimiter);
// ──── Global Error Handler & 404 ────
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
