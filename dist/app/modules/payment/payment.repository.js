import { Types } from "mongoose";
import Enrollment from "../enrollment/enrollment.model.js";
import Payment from "./payment.model.js";
const isValidObjectId = (id) => {
    return typeof id === "string" && Types.ObjectId.isValid(id);
};
const findPaymentByEnrollmentId = async (enrollmentId) => {
    if (!isValidObjectId(enrollmentId)) {
        return null;
    }
    return await Payment.findOne({
        enrollment: { $eq: new Types.ObjectId(enrollmentId) },
    });
};
const findEnrollmentWithUser = async (enrollmentId) => {
    if (!isValidObjectId(enrollmentId)) {
        return null;
    }
    return await Enrollment.findOne({
        _id: { $eq: new Types.ObjectId(enrollmentId) },
    }).populate("user", "name email phone address");
};
const updatePaymentStatus = async (transactionId, status, fromStatus, session) => {
    // Build filter — include prior-state guard when provided for CAS semantics.
    const filter = {
        transactionId: { $eq: transactionId },
    };
    if (fromStatus !== undefined) {
        filter.status = { $eq: fromStatus };
    }
    return await Payment.findOneAndUpdate(filter, { status }, { returnDocument: "after", runValidators: true, session });
};
const updateEnrollmentStatus = async (enrollmentId, status, session) => {
    if (!isValidObjectId(enrollmentId)) {
        return null;
    }
    return await Enrollment.findOneAndUpdate({ _id: { $eq: new Types.ObjectId(enrollmentId) } }, { status }, { returnDocument: "after", runValidators: true, session })
        .populate("workshop", "title")
        .populate("user", "name email");
};
const findPaymentById = async (paymentId) => {
    if (!isValidObjectId(paymentId)) {
        return null;
    }
    return await Payment.findOne({
        _id: { $eq: new Types.ObjectId(paymentId) },
    });
};
const findPaymentByTransactionId = async (transactionId) => {
    return await Payment.findOne({
        transactionId: { $eq: transactionId },
    });
};
const findPaymentWithEnrollment = async (paymentId) => {
    if (!isValidObjectId(paymentId)) {
        return null;
    }
    return await Payment.findOne({
        _id: { $eq: new Types.ObjectId(paymentId) },
    });
};
const startTransaction = async () => {
    const session = await Enrollment.startSession();
    session.startTransaction();
    return session;
};
const PaymentRepository = {
    findPaymentByEnrollmentId,
    findEnrollmentWithUser,
    findPaymentByTransactionId,
    updatePaymentStatus,
    updateEnrollmentStatus,
    findPaymentById,
    findPaymentWithEnrollment,
    startTransaction,
};
export default PaymentRepository;
