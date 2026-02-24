"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const env_1 = __importDefault(require("../../config/env"));
const router = (0, express_1.Router)();
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.default.credentialsLogin);
router.post("/refresh-token", rateLimiter_1.authLimiter, auth_controller_1.default.getNewAccessToken);
router.post("/logout", rateLimiter_1.authLimiter, auth_controller_1.default.logout);
router.post("/change-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.changePassword);
router.post("/set-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.setPassword);
router.post("/forgot-password", rateLimiter_1.authLimiter, auth_controller_1.default.forgotPassword);
router.post("/reset-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.resetPassword);
router.get("/google", rateLimiter_1.authLimiter, async (req, res, next) => {
    const redirect = req.query.redirect || "/";
    passport_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: redirect,
    })(req, res, next);
});
router.get("/google/callback", rateLimiter_1.authLimiter, passport_1.default.authenticate("google", {
    failureRedirect: `${env_1.default.FRONTEND_URL}/login?error=${encodeURIComponent("There are some issues with your account. Please contact our support team.")}`,
}), auth_controller_1.default.googleCallback);
const AuthRoutes = router;
exports.default = AuthRoutes;
