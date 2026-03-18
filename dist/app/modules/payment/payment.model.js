"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const auditPlugin_1 = __importDefault(require("../../utils/auditPlugin"));
const payment_interface_1 = require("./payment.interface");
const paymentSchema = new mongoose_1.Schema({
    enrollment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Enrollment",
        required: true,
        unique: true,
    },
    transactionId: {
        type: String,
        required: true,
        unique: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    paymentGatewayData: {
        type: mongoose_1.Schema.Types.Mixed,
    },
    invoiceUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(payment_interface_1.PAYMENT_STATUS),
        default: payment_interface_1.PAYMENT_STATUS.UNPAID,
        index: true,
    },
}, {
    timestamps: true,
});
paymentSchema.plugin(auditPlugin_1.default);
const Payment = (0, mongoose_1.model)("Payment", paymentSchema);
exports.default = Payment;
