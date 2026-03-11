import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { authLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import PaymentController from "./payment.controller";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Payment
 *   description: Payment management
 */

/**
 * @openapi
 * /payment/init-payment/{enrollmentId}:
 *   post:
 *     summary: Initialize payment for an enrollment
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment initialized successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     gatewayUrl:
 *                       type: string
 */
router.post(
  "/init-payment/:enrollmentId",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.initPayment,
);

/**
 * @openapi
 * /payment/success:
 *   post:
 *     summary: Payment success callback
 *     tags: [Payment]
 *     description: Called by payment gateway
 *     responses:
 *       302:
 *         description: Redirects to frontend success page
 */
router.post("/success", PaymentController.successPayment);

/**
 * @openapi
 * /payment/fail:
 *   post:
 *     summary: Payment fail callback
 *     tags: [Payment]
 *     description: Called by payment gateway
 *     responses:
 *       302:
 *         description: Redirects to frontend fail page
 */
router.post("/fail", PaymentController.failPayment);

/**
 * @openapi
 * /payment/cancel:
 *   post:
 *     summary: Payment cancel callback
 *     tags: [Payment]
 *     description: Called by payment gateway
 *     responses:
 *       302:
 *         description: Redirects to frontend cancel page
 */
router.post("/cancel", PaymentController.cancelPayment);

/**
 * @openapi
 * /payment/invoice/{paymentId}:
 *   get:
 *     summary: Get invoice download URL
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invoice URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 */
router.get(
  "/invoice/:paymentId",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.getInvoiceDownloadUrl,
);

/**
 * @openapi
 * /payment/validate-payment:
 *   post:
 *     summary: Validate payment manually
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - val_id
 *             properties:
 *               val_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment validated successfully
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
 *                   example: Payment validated successfully
 */
router.post(
  "/validate-payment",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.validatePayment,
);

const PaymentRoutes = router;

export default PaymentRoutes;
