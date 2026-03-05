import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { authLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import PaymentController from "./payment.controller";

const router = express.Router();

router.post(
  "/init-payment/:enrollmentId",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.initPayment,
);
router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);
router.get(
  "/invoice/:paymentId",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.getInvoiceDownloadUrl,
);
router.post(
  "/validate-payment",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  PaymentController.validatePayment,
);

const PaymentRoutes = router;

export default PaymentRoutes;
