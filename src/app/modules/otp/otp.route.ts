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
 *     description: >
 *       Sends a one-time password to the user's email or phone number.
 *       At least one of `email` or `phone` must be provided.
 *       Rate limited to prevent abuse.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *               phone:
 *                 type: string
 *                 description: User's phone number (Bangladesh format)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       429:
 *         description: Too Many Requests — rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Too many requests, please try again later."
 */
router.post("/send", strictLimiter, OTPController.sendOtp);

/**
 * @openapi
 * /otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [OTP]
 *     description: >
 *       Verifies the OTP sent to the user's email or phone.
 *       Rate limited to prevent brute-force attempts.
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
 *                 format: email
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *                 description: The OTP code to verify
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       429:
 *         description: Too Many Requests — rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Too many requests, please try again later."
 */
router.post("/verify", strictLimiter, OTPController.verifyOtp);

const OTPRoutes = router;

export default OTPRoutes;
