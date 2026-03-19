import { ClientSession, Types } from "mongoose";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface";
import Enrollment from "../enrollment/enrollment.model";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";

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
  return await Payment.findById(paymentId).select("invoiceUrl");
};

const startTransaction = async () => {
  const session = await Enrollment.startSession();
  session.startTransaction();
  return session;
};

const PaymentRepository = {
  findPaymentByEnrollmentId,
  findEnrollmentWithUser,
  updatePaymentStatus,
  updateEnrollmentStatus,
  findPaymentById,
  startTransaction,
};

export default PaymentRepository;
