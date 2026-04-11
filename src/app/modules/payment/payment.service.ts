import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { mailQueue } from "../../jobs/mail.queue";
import auditLogger from "../../utils/auditLogger";
import logger from "../../utils/logger";
import { AuditAction } from "../audit/audit.interface";
import {
  ENROLLMENT_STATUS,
  IEnrollmentPopulated,
} from "../enrollment/enrollment.interface";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import { UserRole } from "../user/user.interface";
import PaymentRepository from "./payment.repository";

const initPayment = async (enrollmentId: string, userId: string) => {
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

  const enrollmentUser = populatedEnrollment.user;
  if (!enrollmentUser || !enrollmentUser._id) {
    throw new AppError(StatusCodes.NOT_FOUND, "User associated with enrollment not found");
  }

  const enrollmentUserId = String(enrollmentUser._id);
  if (enrollmentUserId !== userId) {
    throw new AppError(StatusCodes.FORBIDDEN, "You can only initiate payment for your own enrollment");
  }

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

const getInvoiceDownloadUrl = async (paymentId: string, userId: string, userRole: string) => {
  const payment = await PaymentRepository.findPaymentById(paymentId);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
  if (!isAdmin) {
    const enrollment = await PaymentRepository.findEnrollmentWithUser(String(payment.enrollment));
    if (!enrollment || String(enrollment.user) !== userId) {
      throw new AppError(StatusCodes.FORBIDDEN, "You can only access your own invoices");
    }
  }

  if (!payment.invoiceUrl) {
    throw new AppError(StatusCodes.NOT_FOUND, "Invoice not found");
  }

  return payment.invoiceUrl;
};

const handleIPN = async (body: Record<string, string>) => {
  const transactionId = (body.tran_id || "").trim();
  const status = (body.status || "").trim();
  const valId = (body.val_id || "").trim();

  if (!transactionId) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Missing tran_id in IPN");
  }

  logger.info({
    msg: "IPN received",
    transactionId,
    status,
  });

  if (status === "VALID" && valId) {
    await SSLService.validatePayment({ val_id: valId, tran_id: transactionId });

    const session = await PaymentRepository.startTransaction();
    try {
      const updatedPayment = await PaymentRepository.updatePaymentStatus(
        transactionId,
        PAYMENT_STATUS.PAID,
        session,
      );

      if (updatedPayment) {
        await PaymentRepository.updateEnrollmentStatus(
          String(updatedPayment.enrollment),
          ENROLLMENT_STATUS.COMPLETE,
          session,
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw err;
    }
  } else if (status === "FAILED") {
    const session = await PaymentRepository.startTransaction();
    try {
      const updatedPayment = await PaymentRepository.updatePaymentStatus(
        transactionId,
        PAYMENT_STATUS.FAILED,
        session,
      );

      if (updatedPayment) {
        await PaymentRepository.updateEnrollmentStatus(
          String(updatedPayment.enrollment),
          ENROLLMENT_STATUS.FAILED,
          session,
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw err;
    }
  }

  return { received: true };
};

const refundPayment = async (
  paymentId: string,
  userId: string,
  reason?: string,
) => {
  const payment = await PaymentRepository.findPaymentWithEnrollment(paymentId);

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status !== PAYMENT_STATUS.PAID) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Only paid payments can be refunded",
    );
  }

  const session = await PaymentRepository.startTransaction();

  try {
    const updatedPayment = await PaymentRepository.updatePaymentStatus(
      payment.transactionId,
      PAYMENT_STATUS.REFUNDED,
      session,
    );

    if (updatedPayment) {
      await PaymentRepository.updateEnrollmentStatus(
        String(updatedPayment.enrollment),
        ENROLLMENT_STATUS.CANCEL,
        session,
      );
    }

    await session.commitTransaction();
    session.endSession();

    await auditLogger({
      action: AuditAction.UPDATE,
      collectionName: "Payment",
      documentId: paymentId,
      performedBy: userId,
      changes: { status: PAYMENT_STATUS.REFUNDED, reason },
    });

    return {
      success: true,
      message: "Payment refunded successfully",
    };
  } catch (err) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    throw err;
  }
};

const PaymentService = {
  initPayment,
  successPayment,
  failPayment,
  cancelPayment,
  getInvoiceDownloadUrl,
  handleIPN,
  refundPayment,
};

export default PaymentService;
