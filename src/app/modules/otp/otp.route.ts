import express from "express";
import OTPController from "./otp.controller";
import { strictLimiter } from "../../utils/rateLimiter";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: OTP
 *   description: OTP verification operations
 */

/**
 * @openapi
 * /otp/send:
 *   post:
 *     summary: Send OTP to user email or phone
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send", OTPController.sendOtp);

/**
 * @openapi
 * /otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/verify", strictLimiter, OTPController.verifyOtp);

const OTPRoutes = router;

export default OTPRoutes;
