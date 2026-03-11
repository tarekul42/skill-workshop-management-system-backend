"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const payment_controller_1 = __importDefault(require("./payment.controller"));
const router = express_1.default.Router();
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
router.post("/init-payment/:enrollmentId", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), payment_controller_1.default.initPayment);
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
router.post("/success", payment_controller_1.default.successPayment);
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
router.post("/fail", payment_controller_1.default.failPayment);
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
router.post("/cancel", payment_controller_1.default.cancelPayment);
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
router.get("/invoice/:paymentId", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), payment_controller_1.default.getInvoiceDownloadUrl);
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
router.post("/validate-payment", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), payment_controller_1.default.validatePayment);
const PaymentRoutes = router;
exports.default = PaymentRoutes;
