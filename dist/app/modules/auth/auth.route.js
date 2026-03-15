"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const env_1 = __importDefault(require("../../config/env"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const auth_controller_1 = __importDefault(require("./auth.controller"));
const router = (0, express_1.Router)();
/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Authentication management
 */
/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Abc123!"
 *                 description: "Existing account password."
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: "string" }
 *                         refreshToken: { type: "string" }
 *                         user: { $ref: "#/components/schemas/User" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.post("/login", rateLimiter_1.authLimiter, auth_controller_1.default.credentialsLogin);
/**
 * @openapi
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Refresh token must be provided in cookies.
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         accessToken: { type: "string" }
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/refresh-token", rateLimiter_1.authLimiter, auth_controller_1.default.getNewAccessToken);
/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Logout successful
 */
router.post("/logout", rateLimiter_1.authLimiter, auth_controller_1.default.logout);
/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.post("/change-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.changePassword);
/**
 * @openapi
 * /auth/set-password:
 *   post:
 *     summary: Set password for users who logged in via social auth
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.post("/set-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.setPassword);
/**
 * @openapi
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/forgot-password", rateLimiter_1.authLimiter, auth_controller_1.default.forgotPassword);
/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/reset-password", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), auth_controller_1.default.resetPassword);
/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: redirect
 *         schema:
 *           type: string
 *         description: URL to redirect after successful login
 *     responses:
 *       302:
 *         description: Redirects to Google login page
 */
router.get("/google", rateLimiter_1.authLimiter, async (req, res, next) => {
    const redirect = req.query.redirect || "/";
    passport_1.default.authenticate("google", {
        scope: ["profile", "email"],
        state: redirect,
    })(req, res, next);
});
/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     description: Handles the callback from Google after authentication
 *     responses:
 *       302:
 *         description: Redirects to the frontend application
 */
router.get("/google/callback", rateLimiter_1.authLimiter, passport_1.default.authenticate("google", {
    failureRedirect: `${env_1.default.FRONTEND_URL}/login?error=${encodeURIComponent("There are some issues with your account. Please contact our support team.")}`,
}), auth_controller_1.default.googleCallback);
const AuthRoutes = router;
exports.default = AuthRoutes;
