/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface";
import Enrollment from "../enrollment/enrollment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";

const initPayment = async (enrollmentId: string) => {
  const payment = await Payment.findOne({ enrollment: enrollmentId });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  const enrollment = await Enrollment.findById(payment.enrollment);

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  const userAddress = (enrollment.user as any).address;
  const userEmail = (enrollment.user as any).email;
  const userPhoneNumber = (enrollment.user as any).phone;
  const userName = (enrollment.user as any).name;

  const sslPayload: ISSLCommerz = {
    address: userAddress,
    email: userEmail,
    phoneNumber: userPhoneNumber,
    name: userName,
    amount: payment.amount,
    transactionId: payment.transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    paymentUrl: sslPayment.GatewayPageURL,
  };
};

const successPayment = async (query: Record<string, string>) => {
  const rawTransactionId = query.transactionId;

  if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const transactionId = rawTransactionId.trim();

  const session = await Enrollment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: { $eq: transactionId } },
      { status: PAYMENT_STATUS.PAID },
      { new: true, runValidators: true, session },
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await Enrollment.findByIdAndUpdate(
      updatedPayment.enrollment,
      { status: ENROLLMENT_STATUS.COMPLETE },
      { runValidators: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: true,
      message: "Payment completed successfully",
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const failPayment = async (query: Record<string, string>) => {
  const rawTransactionId = query.transactionId;

  if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const transactionId = rawTransactionId.trim();

  const session = await Enrollment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: { $eq: transactionId } },
      { status: PAYMENT_STATUS.FAILED },
      { new: true, runValidators: true, session },
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await Enrollment.findByIdAndUpdate(
      updatedPayment.enrollment,
      { status: ENROLLMENT_STATUS.FAILED },
      { runValidators: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: false,
      message: "Payment Failed",
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const cancelPayment = async (query: Record<string, string>) => {
  const rawTransactionId = query.transactionId;

  if (typeof rawTransactionId !== "string" || !rawTransactionId.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const transactionId = rawTransactionId.trim();

  const session = await Enrollment.startSession();
  session.startTransaction();

  try {
    const updatedPayment = await Payment.findOneAndUpdate(
      { transactionId: { $eq: transactionId } },
      { status: PAYMENT_STATUS.CANCELLED },
      { new: true, runValidators: true, session },
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await Enrollment.findByIdAndUpdate(
      updatedPayment.enrollment,
      { status: ENROLLMENT_STATUS.CANCEL },
      { runValidators: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      success: false,
      message: "Payment Cancelled",
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
};

export default PaymentService;
