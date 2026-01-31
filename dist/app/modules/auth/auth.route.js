"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const user_interface_1 = require("../user/user.interface");
const router = (0, express_1.Router)();
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.default.creadentialsLogin);
router.post("/refresh-token", rateLimiter_1.authLimiter, auth_controller_1.default.getNewAccessToken);
router.post("/logout", rateLimiter_1.authLimiter, auth_controller_1.default.logout);
router.post("/reset-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.resetPassword);
const AuthRoutes = router;
exports.default = AuthRoutes;
