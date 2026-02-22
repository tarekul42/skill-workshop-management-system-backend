/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";

enum PAYMENT_STATUS {
  PAID = "PAID",
  UNPAID = "UNPAID",
  CANCELLED = "CANCELLED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

interface IPayment {
  enrollment: Types.ObjectId;
  transactionId: string;
  amount: number;
  paymentGatewayData?: any;
  invoiceUrl?: string;
  status: PAYMENT_STATUS;
}

export { IPayment, PAYMENT_STATUS };
