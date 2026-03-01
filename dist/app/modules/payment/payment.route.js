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
router.post("/init-payment/:enrollmentId", rateLimiter_1.authLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), payment_controller_1.default.initPayment);
router.post("/success", payment_controller_1.default.successPayment);
router.post("/fail", payment_controller_1.default.failPayment);
router.post("/cancel", payment_controller_1.default.cancelPayment);
const PaymentRoutes = router;
exports.default = PaymentRoutes;
