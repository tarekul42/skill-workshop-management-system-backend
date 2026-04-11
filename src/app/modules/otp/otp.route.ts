import express from "express";
import { strictLimiter } from "../../utils/rateLimiter";
import OTPController from "./otp.controller";

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/send", strictLimiter, OTPController.sendOtp);

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/verify", strictLimiter, OTPController.verifyOtp);

const OTPRoutes = router;

export default OTPRoutes;
