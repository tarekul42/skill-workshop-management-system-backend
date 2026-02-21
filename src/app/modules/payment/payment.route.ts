import express from "express";
import PaymentController from "./payment.controller";

const router = express.Router();

router.post("/init-payment/:enrollmentId", PaymentController.initPayment);
router.post("/success", PaymentController.successPayment);
router.post("/fail", PaymentController.failPayment);
router.post("/cancel", PaymentController.cancelPayment);

const PaymentRoutes = router;

export default PaymentRoutes;
