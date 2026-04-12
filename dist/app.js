import { RedisStore } from "connect-redis";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import expressSession from "express-session";
import helmet from "helmet";
import hpp from "hpp";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { doubleCsrfProtection, generateCsrfToken, } from "./app/config/csrf.config.js";
import envVariables from "./app/config/env.js";
import "./app/config/passport.js";
import { redisClient } from "./app/config/redis.config.js";
import { swaggerSpec } from "./app/config/swagger.config.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler.js";
import mongoSanitize from "./app/middlewares/mongoSanitize.js";
import notFound from "./app/middlewares/notFound.js";
import requestLogger from "./app/middlewares/requestLogger.js";
import apiRouter from "./app/route/api.js";
import { auditContextMiddleware } from "./app/utils/auditContext.js";
import logger from "./app/utils/logger.js";
import { httpRequestDurationMicroseconds, register, updateSystemMetrics, } from "./app/utils/metrics.js";
import { generalLimiter } from "./app/utils/rateLimiter.js";
const app = express();
// ──── Security Check ────
const requiredSecrets = [
    {
        name: "EXPRESS_SESSION_SECRET",
        value: envVariables.EXPRESS_SESSION_SECRET,
    },
    { name: "JWT_ACCESS_SECRET", value: envVariables.JWT_ACCESS_SECRET },
    { name: "JWT_REFRESH_SECRET", value: envVariables.JWT_REFRESH_SECRET },
    { name: "CSRF_SECRET", value: envVariables.CSRF_SECRET },
    { name: "RESET_PASSWORD_SECRET", value: envVariables.RESET_PASSWORD_SECRET },
];
for (const secret of requiredSecrets) {
    if (secret.value.length < 32 && envVariables.NODE_ENV === "production") {
        throw new Error(`${secret.name} must be at least 32 characters in production. Current length: ${secret.value.length}`);
    }
    if (secret.value.length < 16 && envVariables.NODE_ENV !== "production") {
        logger.warn({
            msg: `${secret.name} is below the recommended minimum length.`,
        });
    }
}
// ──── HTTP Request Logger ────
app.use(requestLogger);
// ──── Metrics Middleware ────
app.use((req, res, next) => {
    const start = process.hrtime();
    res.on("finish", () => {
        const durationInSeconds = process.hrtime(start)[0] + process.hrtime(start)[1] / 1e9;
        // Use req.route.path if available (matched express route)
        // Otherwise use a generic label to prevent cardinality explosion DoS
        const route = req.route ? req.route.path : "(unmatched)";
        httpRequestDurationMicroseconds.observe({
            method: req.method,
            route,
            status_code: res.statusCode,
        }, durationInSeconds);
    });
    next();
});
// ──── Security Headers ────
// contentSecurityPolicy is configured to allow swagger-ui-express assets
const helmetOptions = envVariables.NODE_ENV === "production"
    ? {}
    : {
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
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://cdnjs.cloudflare.com",
                ],
                imgSrc: ["'self'", "data:", "validator.swagger.io"],
                connectSrc: [
                    "'self'",
                    "https://vercel.live",
                    "https://cdnjs.cloudflare.com",
                ],
                frameSrc: ["'self'", "https://vercel.live"],
            },
        },
    };
app.use(helmet(helmetOptions));
app.set("trust proxy", 1);
// ──── CORS ────
const allowedOrigins = envVariables.FRONTEND_URL.split(",").map((s) => s.trim());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
}));
// ──── Body Parsers ────
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// ──── Cookie Parser ────
app.use(cookieParser());
// ──── Input Sanitization ────
app.use(mongoSanitize); // strip $ and . from req.body/query/params
app.use(hpp()); // prevent HTTP parameter pollution
// ──── Session & Auth ────
app.use(expressSession({
    store: new RedisStore({ client: redisClient }),
    secret: envVariables.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: envVariables.NODE_ENV === "production",
        httpOnly: true,
        sameSite: envVariables.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
}));
app.use(passport.initialize());
// ──── CSRF Protection ────
app.use(doubleCsrfProtection);
// ──── Audit Context ────
app.use(auditContextMiddleware);
// ──── Swagger Documentation ────
app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerSpec);
});
if (envVariables.NODE_ENV !== "production") {
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: ".swagger-ui .topbar { display: none }",
    }));
}
else {
    app.get("/api-docs", (_req, res) => {
        res
            .status(404)
            .json({ message: "API documentation is not available in production" });
    });
}
// ──── CSRF Token Endpoint ────
app.get("/api/v1/csrf-token", (req, res) => {
    const token = generateCsrfToken(req, res);
    res.status(200).json({ csrfToken: token });
});
// Versioned CSRF token endpoint for newer clients (and to support header-based versioning)
app.get("/api/csrf-token", (req, res) => {
    const token = generateCsrfToken(req, res);
    res.status(200).json({ csrfToken: token });
});
// ──── API Routes ────
app.use("/api", generalLimiter, apiRouter);
// ──── Metrics Endpoint ────
app.get("/metrics", async (req, res) => {
    const apiKey = req.headers["x-metrics-key"];
    if (apiKey !== envVariables.METRICS_API_KEY) {
        return res.status(403).end("Forbidden");
    }
    try {
        await updateSystemMetrics();
        res.set("Content-Type", register.contentType);
        res.end(await register.metrics());
    }
    catch (ex) {
        logger.error({ msg: "Error while collecting metrics", err: ex });
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
app.use(notFound);
app.use(globalErrorHandler);
export default app;
