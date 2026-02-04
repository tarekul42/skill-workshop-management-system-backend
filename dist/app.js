"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const route_1 = __importDefault(require("./app/route"));
const globalErrorHandler_1 = __importDefault(require("./app/middlewares/globalErrorHandler"));
const notFound_1 = __importDefault(require("./app/middlewares/notFound"));
const rateLimiter_1 = require("./app/utils/rateLimiter");
const express_session_1 = __importDefault(require("express-session"));
const env_1 = __importDefault(require("./app/config/env"));
const passport_1 = __importDefault(require("passport"));
require("./app/config/passport");
const app = (0, express_1.default)();
app.set("trust proxy", 1);
app.use((0, express_session_1.default)({
    secret: env_1.default.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        httpOnly: true,
    },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use("/api/v1", rateLimiter_1.generalLimiter, route_1.default);
app.get("/", (_req, res) => {
    res.status(200).json({
        message: "Skill Workshop Management System Backend is up and running.",
    });
});
app.use(globalErrorHandler_1.default);
app.use(notFound_1.default);
exports.default = app;
