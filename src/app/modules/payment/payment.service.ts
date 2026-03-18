import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { mailQueue } from "../../jobs/mail.queue";
import {
  ENROLLMENT_STATUS,
  IEnrollmentPopulated,
} from "../enrollment/enrollment.interface";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import PaymentRepository from "./payment.repository";

const initPayment = async (enrollmentId: string) => {
  if (!enrollmentId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
  }

  const payment =
    await PaymentRepository.findPaymentByEnrollmentId(enrollmentId);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment already completed");
  }

  const enrollment =
    await PaymentRepository.findEnrollmentWithUser(enrollmentId);

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Enrollment is not pending");
  }

  const populatedEnrollment = enrollment as unknown as IEnrollmentPopulated;
  const user = populatedEnrollment.user;

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

const successPayment = async (
  query: Record<string, string>,
  body: Record<string, string>,
) => {
  const transactionId = (query.transactionId || "").trim();

  if (!transactionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const val_id = (body.val_id || "").trim();

  if (!val_id) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid val_id");
  }

  await SSLService.validatePayment({
    val_id,
    tran_id: transactionId,
  });

  const session = await PaymentRepository.startTransaction();

  try {
    const updatedPayment = await PaymentRepository.updatePaymentStatus(
      transactionId,
      PAYMENT_STATUS.PAID,
      session,
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    const updatedEnrollment = await PaymentRepository.updateEnrollmentStatus(
      String(updatedPayment.enrollment),
      ENROLLMENT_STATUS.COMPLETE,
      session,
    );

    if (!updatedEnrollment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }

    const populatedEnrollment =
      updatedEnrollment as unknown as IEnrollmentPopulated;

    await session.commitTransaction();
    session.endSession();

    await mailQueue.add("invoice", {
      type: "invoice",
      payload: {
        to: populatedEnrollment.user.email,
        transactionId: updatedPayment.transactionId,
        enrollmentDate: populatedEnrollment.createdAt as Date,
        userName: populatedEnrollment.user.name,
        workshopTitle: populatedEnrollment.workshop.title,
        studentCount: populatedEnrollment.studentCount,
        totalAmount: updatedPayment.amount,
        email: populatedEnrollment.user.email,
      },
    });

    return {
      success: true,
      message: "Payment completed successfully",
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw err;
  }
};

const failPayment = async (query: Record<string, string>) => {
  const transactionId = (query.transactionId || "").trim();

  if (!transactionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const session = await PaymentRepository.startTransaction();

  try {
    const updatedPayment = await PaymentRepository.updatePaymentStatus(
      transactionId,
      PAYMENT_STATUS.FAILED,
      session,
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await PaymentRepository.updateEnrollmentStatus(
      String(updatedPayment.enrollment),
      ENROLLMENT_STATUS.FAILED,
      session,
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
  const transactionId = (query.transactionId || "").trim();

  if (!transactionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }

  const session = await PaymentRepository.startTransaction();

  try {
    const updatedPayment = await PaymentRepository.updatePaymentStatus(
      transactionId,
      PAYMENT_STATUS.CANCELLED,
      session,
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await PaymentRepository.updateEnrollmentStatus(
      String(updatedPayment.enrollment),
      ENROLLMENT_STATUS.CANCEL,
      session,
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

const getInvoiceDownloadUrl = async (paymentId: string) => {
  const payment = await PaymentRepository.findPaymentById(paymentId);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (!payment.invoiceUrl) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");
  }

  return payment.invoiceUrl;
};

const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getInvoiceDownloadUrl,
};

export default PaymentService;
