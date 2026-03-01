/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface";
import Enrollment from "../enrollment/enrollment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";

const initPayment = async (enrollmentId: string) => {
  if (!enrollmentId || !Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
  }

  const payment = await Payment.findOne({ enrollment: { $eq: new Types.ObjectId(enrollmentId) } });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment already completed");
  }

  const enrollment = await Enrollment.findOne({ _id: { $eq: new Types.ObjectId(payment.enrollment as any) } }).populate(
    "user",
    "name email phone address",
  );

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Enrollment is not pending",
    );
  }

  const user = enrollment.user as any;

  if (!user?.address || !user?.phone) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "User profile is incomplete. Please update address and phone number.",
    );
  }

  const sslPayload: ISSLCommerz = {
    address: user.address,
    email: user.email,
    phoneNumber: user.phone,
    name: user.name,
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

    await Enrollment.findOneAndUpdate(
      { _id: { $eq: new Types.ObjectId(updatedPayment.enrollment as any) } },
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
