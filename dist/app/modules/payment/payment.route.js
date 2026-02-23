"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const payment_controller_1 = __importDefault(require("./payment.controller"));
const router = express_1.default.Router();
router.post("/init-payment/:enrollmentId", payment_controller_1.default.initPayment);
router.post("/success", payment_controller_1.default.successPayment);
router.post("/fail", payment_controller_1.default.failPayment);
router.post("/cancel", payment_controller_1.default.cancelPayment);
const PaymentRoutes = router;
exports.default = PaymentRoutes;
