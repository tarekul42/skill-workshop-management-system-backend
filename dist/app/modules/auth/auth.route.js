"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const router = (0, express_1.Router)();
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.default.creadentialsLogin);
router.post("/refresh-token", rateLimiter_1.authLimiter, auth_controller_1.default.getNewAccessToken);
const AuthRoutes = router;
exports.default = AuthRoutes;
