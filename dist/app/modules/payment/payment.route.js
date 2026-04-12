import express from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { adminCrudLimiter, authLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import PaymentController from "./payment.controller.js";
import { refundPaymentBodySchema, validatePaymentBodySchema, } from "./payment.validation.js";
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         gatewayUrl: { type: "string" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/init-payment/:enrollmentId", authLimiter, checkAuth(UserRole.STUDENT), PaymentController.initPayment);
/**
 * @openapi
 * /payment/success:
 *   get:
 *     summary: Payment success callback
 *     tags: [Payment]
 *     description: Called by payment gateway via browser redirect
 *     responses:
 *       200:
 *         description: Success page HTML
 *   post:
 *     summary: Payment success callback
 *     tags: [Payment]
 *     description: Called by payment gateway via IPN or direct POST
 *     responses:
 *       302:
 *         description: Redirects to frontend success page
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router
    .route("/success")
    .get(PaymentController.successPayment)
    .post(PaymentController.successPayment);
/**
 * @openapi
 * /payment/fail:
 *   get:
 *     summary: Payment fail callback
 *     tags: [Payment]
 *     description: Called by payment gateway via browser redirect
 *     responses:
 *       200:
 *         description: Failure page HTML
 *   post:
 *     summary: Payment fail callback
 *     tags: [Payment]
 *     description: Called by payment gateway via direct POST
 *     responses:
 *       302:
 *         description: Redirects to frontend failure page
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router
    .route("/fail")
    .get(PaymentController.failPayment)
    .post(PaymentController.failPayment);
/**
 * @openapi
 * /payment/cancel:
 *   get:
 *     summary: Payment cancel callback
 *     tags: [Payment]
 *     description: Called by payment gateway via browser redirect
 *     responses:
 *       200:
 *         description: Cancellation page HTML
 *   post:
 *     summary: Payment cancel callback
 *     tags: [Payment]
 *     description: Called by payment gateway via direct POST
 *     responses:
 *       302:
 *         description: Redirects to frontend cancellation page
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router
    .route("/cancel")
    .get(PaymentController.cancelPayment)
    .post(PaymentController.cancelPayment);
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         url: { type: "string" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/invoice/:paymentId", authLimiter, checkAuth(...Object.values(UserRole)), PaymentController.getInvoiceDownloadUrl);
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
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/validate-payment", authLimiter, checkAuth(...Object.values(UserRole)), validateRequest(validatePaymentBodySchema), PaymentController.validatePayment);
/**
 * @openapi
 * /payment/ipn:
 *   post:
 *     summary: SSLCommerz IPN (Instant Payment Notification)
 *     tags: [Payment]
 *     description: Called asynchronously by SSLCommerz to notify payment status changes. Receives form-encoded data with transaction details.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - val_id
 *               - tran_id
 *               - status
 *             properties:
 *               val_id:
 *                 type: string
 *               tran_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [VALID, FAILED, CANCELLED]
 *                 description: Payment status from SSLCommerz
 *               amount:
 *                 type: string
 *               currency:
 *                 type: string
 *               card_type:
 *                 type: string
 *               store_amount:
 *                 type: string
 *     responses:
 *       200:
 *         description: IPN processed successfully
 *       400:
 *         description: Invalid IPN payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         description: Internal server error while processing IPN
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.post("/ipn", PaymentController.handleIPN);
/**
 * @openapi
 * /payment/refund:
 *   post:
 *     summary: Refund a payment
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
 *               - paymentId
 *             properties:
 *               paymentId:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment refunded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.post("/refund", adminCrudLimiter, checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), validateRequest(refundPaymentBodySchema), PaymentController.refundPayment);
const PaymentRoutes = router;
export default PaymentRoutes;
