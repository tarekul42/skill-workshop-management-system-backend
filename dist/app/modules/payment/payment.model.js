import { model, Schema } from "mongoose";
import auditPlugin from "../../utils/auditPlugin.js";
import { PAYMENT_STATUS } from "./payment.interface.js";
const paymentSchema = new Schema({
    enrollment: {
        type: Schema.Types.ObjectId,
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
        type: Schema.Types.Mixed,
    },
    invoiceUrl: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(PAYMENT_STATUS),
        default: PAYMENT_STATUS.UNPAID,
        index: true,
    },
}, {
    timestamps: true,
});
paymentSchema.plugin(auditPlugin);
const Payment = model("Payment", paymentSchema);
export default Payment;
