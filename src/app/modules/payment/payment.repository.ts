import { ClientSession, Types } from "mongoose";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface.js";
import Enrollment from "../enrollment/enrollment.model.js";
import { PAYMENT_STATUS } from "./payment.interface.js";
import Payment from "./payment.model.js";

const findPaymentByEnrollmentId = async (enrollmentId: string) => {
  return await Payment.findOne({
    enrollment: { $eq: new Types.ObjectId(enrollmentId) },
  });
};

const findEnrollmentWithUser = async (enrollmentId: string) => {
  return await Enrollment.findOne({
    _id: { $eq: new Types.ObjectId(enrollmentId) },
  }).populate("user", "name email phone address");
};

const updatePaymentStatus = async (
  transactionId: string,
  status: PAYMENT_STATUS,
  session?: ClientSession,
) => {
  return await Payment.findOneAndUpdate(
    { transactionId: { $eq: transactionId } },
    { status },
    { returnDocument: "after", runValidators: true, session },
  );
};

const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: ENROLLMENT_STATUS,
  session?: ClientSession,
) => {
  return await Enrollment.findOneAndUpdate(
    { _id: { $eq: new Types.ObjectId(enrollmentId) } },
    { status },
    { returnDocument: "after", runValidators: true, session },
  )
    .populate("workshop", "title")
    .populate("user", "name email");
};

const findPaymentById = async (paymentId: string) => {
  if (!Types.ObjectId.isValid(paymentId)) {
    return null;
  }

  return await Payment.findOne({
    _id: { $eq: new Types.ObjectId(paymentId) },
  }).select("invoiceUrl");
};

const findPaymentByTransactionId = async (transactionId: string) => {
  return await Payment.findOne({
    transactionId: { $eq: transactionId },
  });
};

const findPaymentWithEnrollment = async (paymentId: string) => {
  if (!Types.ObjectId.isValid(paymentId)) {
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
