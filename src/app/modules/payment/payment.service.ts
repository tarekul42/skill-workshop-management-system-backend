import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import Payment from "./payment.model";
import Enrollment from "../enrollment/enrollment.model";
import { PAYMENT_STATUS } from "./payment.interface";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface";

const initPayment = async (enrollmentId: string) => {
  const payment = await Payment.findOne({ enrollment: enrollmentId });

  if (!payment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
  }

  const enrollment = await Enrollment.findById(enrollmentId);

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  return {};
};

const successPayment = async (query: Record<string, string>) => {
  const transactionId = query.transactionId;
  if (typeof transactionId !== "string" || !transactionId.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }
    if (typeof query.transactionId !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction id");
    }


  const session = await Enrollment.startSession();
        transactionId: { $eq: query.transactionId },

  try {
    const rawTransactionId = query.transactionId;

        transactionId: { $eq: transactionId },
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction id");
    }

    const transactionId = rawTransactionId.trim();

    const rawTransactionId = query.transactionId;

        transactionId: { $eq: transactionId },
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction id");
    }

    const transactionId = rawTransactionId.trim();

    const updatedPayment = await Payment.findOneAndUpdate(
      {
        transactionId: { $eq: transactionId },
      },
      {
        status: PAYMENT_STATUS.PAID,
      },
      { new: true, runValidators: true, session: session },
    );

    if (!updatedPayment) {
      throw new AppError(StatusCodes.NOT_FOUND, "Payment not found");
    }

    await Enrollment.findByIdAndUpdate(
  const transactionId = query.transactionId;
  if (typeof transactionId !== "string" || !transactionId.trim()) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
    if (typeof query.transactionId !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction id");
    }

  }

      updatedPayment.enrollment,
      { transactionId: { $eq: query.transactionId } },
        status: ENROLLMENT_STATUS.COMPLETE,
      },
      { runValidators: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      { transactionId: { $eq: transactionId } },
      message: "Payment completed successfully",
    };
  } catch (err) {
    await session.commitTransaction();
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
  const transactionId = query.transactionId;
  if (typeof transactionId !== "string" || !transactionId.trim()) {
    if (typeof query.transactionId !== "string") {
      throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transaction id");
    }

    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid transactionId");
  }


      { transactionId: { $eq: query.transactionId } },
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
      {
        status: ENROLLMENT_STATUS.FAILED,
      { transactionId: { $eq: transactionId } },
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
      {
        status: ENROLLMENT_STATUS.CANCEL,
      },
      { runValidators: true, session },
    );

    await session.abortTransaction();
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
