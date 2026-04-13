import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import envVariables from "../../config/env.js";
import checkAuth from "../../middlewares/checkAuth.js";
import checkResetToken from "../../middlewares/checkResetToken.js";
import validateRequest from "../../middlewares/validateRequest.js";
import logger from "../../utils/logger.js";
import { authLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import {
  changePasswordZodSchema,
  forgotPasswordZodSchema,
  resetPasswordZodSchema,
  setPasswordZodSchema,
} from "../user/user.validation.js";
import AuthControllers from "./auth.controller.js";

const router = Router();

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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/login", authLimiter, AuthControllers.credentialsLogin);

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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.post("/refresh-token", authLimiter, AuthControllers.getNewAccessToken);

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
 *               $ref: "#/components/schemas/BaseResponse"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/logout", authLimiter, AuthControllers.logout);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/change-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(changePasswordZodSchema),
  AuthControllers.changePassword,
);

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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.post(
  "/set-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(setPasswordZodSchema),
  AuthControllers.setPassword,
);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordZodSchema),
  AuthControllers.forgotPassword,
);

/**
 * @openapi
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     description: Reset a user's password using a valid reset token (supplied via the checkResetToken middleware).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 description: "New password to set for the account."
 *                 example: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post(
  "/reset-password",
  authLimiter,
  checkResetToken,
  validateRequest(resetPasswordZodSchema),
  AuthControllers.resetPassword,
);

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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get(
  "/google",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    // Pass state as an OBJECT (not a string) so passport-oauth2 uses the
    // StateStore properly. A string value bypasses the store entirely —
    // no nonce is saved to the session, so verification always fails with
    // "Unable to verify authorization request state."
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: { redirect: redirect as string },
    })(req, res, next);
  },
);

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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get(
  "/google/callback",
  authLimiter,
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "google",
      (err: Error | null, user: Express.User | false | null, info?: { message?: string }) => {
        if (err) {
          logger.error({ msg: "[Google OAuth] Internal error", err: err.message || err });
          return res.redirect(
            `${envVariables.FRONTEND_URL}/login?error=${encodeURIComponent(`OAuth error: ${err.message || "Internal server error"}`)}`,
          );
        }
        if (!user) {
          const reason = info?.message || "Authentication failed";
          logger.error({ msg: "[Google OAuth] Auth failed", detail: reason });
          return res.redirect(
            `${envVariables.FRONTEND_URL}/login?error=${encodeURIComponent(reason)}`,
          );
        }
        req.user = user;
        next();
      },
    )(req, res, next);
  },
  AuthControllers.googleCallback,
);

const AuthRoutes = router;

export default AuthRoutes;
