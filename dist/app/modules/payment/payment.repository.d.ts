import { ClientSession, Types } from "mongoose";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface.js";
import { PAYMENT_STATUS } from "./payment.interface.js";
declare const PaymentRepository: {
    findPaymentByEnrollmentId: (enrollmentId: string) => Promise<(import("mongoose").Document<unknown, {}, import("./payment.interface.js").IPayment, {}, import("mongoose").DefaultSchemaOptions> & import("./payment.interface.js").IPayment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findEnrollmentWithUser: (enrollmentId: string) => Promise<(import("mongoose").Document<unknown, {}, import("../enrollment/enrollment.interface.js").IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & import("../enrollment/enrollment.interface.js").IEnrollment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    updatePaymentStatus: (transactionId: string, status: PAYMENT_STATUS, session?: ClientSession) => Promise<(import("mongoose").Document<unknown, {}, import("./payment.interface.js").IPayment, {}, import("mongoose").DefaultSchemaOptions> & import("./payment.interface.js").IPayment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    updateEnrollmentStatus: (enrollmentId: string, status: ENROLLMENT_STATUS, session?: ClientSession) => Promise<(import("mongoose").Document<unknown, {}, import("../enrollment/enrollment.interface.js").IEnrollment, {}, import("mongoose").DefaultSchemaOptions> & import("../enrollment/enrollment.interface.js").IEnrollment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findPaymentById: (paymentId: string) => Promise<(import("mongoose").Document<unknown, {}, import("./payment.interface.js").IPayment, {}, import("mongoose").DefaultSchemaOptions> & import("./payment.interface.js").IPayment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    findPaymentWithEnrollment: (paymentId: string) => Promise<(import("mongoose").Document<unknown, {}, import("./payment.interface.js").IPayment, {}, import("mongoose").DefaultSchemaOptions> & import("./payment.interface.js").IPayment & Required<{
        _id: Types.ObjectId;
    }> & {
        __v: number;
    } & {
        id: string;
    }) | null>;
    startTransaction: () => Promise<import("mongodb").ClientSession>;
};
export default PaymentRepository;
