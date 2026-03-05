
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface";
import Enrollment from "../enrollment/enrollment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import { PAYMENT_STATUS } from "./payment.interface";
import Payment from "./payment.model";
import { generatePDF, IInvoiceData } from "../../utils/invoice";
import { IUser } from "../user/user.interface";
import { IWorkshop } from "../workshop/workshop.interface";
import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import sendEmail from "../../utils/sendEmail";
import logger from "../../utils/logger";

const initPayment = async (enrollmentId: string) => {
  if (!enrollmentId || !Types.ObjectId.isValid(enrollmentId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment ID");
  }

  const payment = await Payment.findOne({
    enrollment: { $eq: new Types.ObjectId(enrollmentId) },
  });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  if (payment.status === PAYMENT_STATUS.PAID) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Payment already completed");
  }

  const enrollment = await Enrollment.findOne({
    _id: { $eq: new Types.ObjectId(String(payment.enrollment)) },
  }).populate("user", "name email phone address");

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  if (enrollment.status !== ENROLLMENT_STATUS.PENDING) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Enrollment is not pending");
  }

  const user = enrollment.user as unknown as { address: string; email: string; phone: string; name: string };

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

    const updatedEnrollment = await Enrollment.findOneAndUpdate(
      { _id: { $eq: new Types.ObjectId(String(updatedPayment.enrollment)) } },
      { status: ENROLLMENT_STATUS.COMPLETE },
      { new: true, runValidators: true, session },
    )
      .populate("workshop", "title")
      .populate("user", "name email");

    if (!updatedEnrollment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }

    await session.commitTransaction();
    session.endSession();

    // Post-transaction processing: Invoice generation, Cloudinary upload, and Email notification
    try {
      const invoiceData: IInvoiceData = {
        transactionId: updatedPayment.transactionId,
        enrollmentDate: updatedEnrollment.createdAt as Date,
        userName: (updatedEnrollment.user as unknown as IUser).name,
        workshopTitle: (updatedEnrollment.workshop as unknown as IWorkshop)
          .title,
        studentCount: updatedEnrollment.studentCount,
        totalAmount: updatedPayment.amount,
      };

      const pdfBuffer = await generatePDF(invoiceData);

      const cloudinaryResult = await uploadBufferToCloudinary(
        pdfBuffer,
        "invoice",
      );

      if (cloudinaryResult) {
        await Payment.findByIdAndUpdate(
          updatedPayment._id,
          { invoiceUrl: cloudinaryResult.secure_url },
          { runValidators: true },
        );
      }

      await sendEmail({
        to: (updatedEnrollment.user as unknown as IUser).email,
        subject: "Your Enrollment Invoice",
        templateName: "invoice",
        templateData: invoiceData as unknown as Record<string, unknown>,
        attachments: [
          {
            filename: "invoice.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      });
    } catch (postError) {
      // Log error but don't fail the response since payment was successful
      logger.error({
        message: "Error in post-payment processing",
        err: postError,
      });
    }

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

const getInvoiceDownloadUrl = async (paymentId: string) => {
  if (!paymentId || !Types.ObjectId.isValid(paymentId)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid payment ID");
  }

  const payment = await Payment.findById(paymentId).select("invoiceUrl");

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
