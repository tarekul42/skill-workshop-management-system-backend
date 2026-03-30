"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const connect_redis_1 = require("connect-redis");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const passport_1 = __importDefault(require("passport"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const csrf_config_1 = require("./app/config/csrf.config");
const env_1 = __importDefault(require("./app/config/env"));
require("./app/config/passport");
const redis_config_1 = require("./app/config/redis.config");
const swagger_config_1 = require("./app/config/swagger.config");
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const mongoSanitize_1 = __importDefault(require("./app/middlewares/mongoSanitize"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const requestLogger_1 = __importDefault(require("./app/middlewares/requestLogger"));
const api_1 = __importDefault(require("./app/route/api"));
const auditContext_1 = require("./app/utils/auditContext");
const logger_1 = __importDefault(require("./app/utils/logger"));
const metrics_1 = require("./app/utils/metrics");
const rateLimiter_1 = require("./app/utils/rateLimiter");
const app = (0, express_1.default)();
// ──── Security Check ────
if (env_1.default.EXPRESS_SESSION_SECRET.length < 32) {
    logger_1.default.warn({
        message: "Warning: EXPRESS_SESSION_SECRET should be at least 32 characters for security.",
    });
}
// ──── HTTP Request Logger ────
app.use(requestLogger_1.default);
// ──── Metrics Middleware ────
app.use((req, res, next) => {
    const start = process.hrtime();
    res.on("finish", () => {
        const durationInSeconds = process.hrtime(start)[0] + process.hrtime(start)[1] / 1e9;
        // Use req.route.path if available (matched express route)
        // Otherwise use a generic label to prevent cardinality explosion DoS
        const route = req.route ? req.route.path : "(unmatched)";
        metrics_1.httpRequestDurationMicroseconds.observe({
            method: req.method,
            route,
            status_code: res.statusCode,
        }, durationInSeconds);
    });
    next();
});
// ──── Security Headers ────
// contentSecurityPolicy is configured to allow swagger-ui-express assets
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                "'unsafe-eval'",
                "https://vercel.live",
                "https://cdnjs.cloudflare.com",
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "validator.swagger.io"],
            connectSrc: [
                "'self'",
                "https://vercel.live",
                "https://cdnjs.cloudflare.com",
            ],
            frameSrc: ["'self'", "https://vercel.live"],
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
// ──── Audit Context ────
app.use(auditContext_1.auditContextMiddleware);
// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
    res.json(swagger_config_1.swaggerSpec);
});
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swagger_config_1.swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }", // example refinement
    customCssUrl: "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui.min.css",
    customJs: [
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-bundle.js",
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.11.0/swagger-ui-standalone-preset.js",
    ],
}));
// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req, res) => {
    const token = (0, csrf_config_1.generateCsrfToken)(req, res);
    res.status(200).json({ csrfToken: token });
});
// Versioned CSRF token endpoint for newer clients (and to support header-based versioning)
app.get("/api/csrf-token", (req, res) => {
    const token = (0, csrf_config_1.generateCsrfToken)(req, res);
    res.status(200).json({ csrfToken: token });
});
// ──── API Routes ────
app.use("/api", rateLimiter_1.generalLimiter, api_1.default);
// ──── Metrics Endpoint ────
app.get("/metrics", async (_req, res) => {
    try {
        await (0, metrics_1.updateSystemMetrics)();
        res.set("Content-Type", metrics_1.register.contentType);
        res.end(await metrics_1.register.metrics());
    }
    catch (ex) {
        logger_1.default.error(ex, "Error while collecting metrics");
        res.status(500).end("Internal server error");
    }
});
// ──── Root Route ────
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Welcome to the Skill Workshop Management System Backend!",
    });
});
// ──── Global Error Handler & 404 ────
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
