import { Types } from "mongoose";
import { IEnrollment } from "../enrollment/enrollment.interface";
declare enum PAYMENT_STATUS {
    PAID = "PAID",
    UNPAID = "UNPAID",
    CANCELLED = "CANCELLED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED"
}
interface IPayment {
    _id?: Types.ObjectId;
    enrollment: Types.ObjectId;
    transactionId: string;
    amount: number;
    paymentGatewayData?: Record<string, unknown>;
    invoiceUrl?: string;
    status: PAYMENT_STATUS;
}
interface IPaymentPopulated extends Omit<IPayment, "enrollment"> {
    enrollment: IEnrollment;
}
export { IPayment, IPaymentPopulated, PAYMENT_STATUS };
