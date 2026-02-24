/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import { getTransactionId } from "../../utils/getTransactionId";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import Payment from "../payment/payment.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import SSLService from "../sslCommerz/sslCommerz.service";
import User from "../user/user.model";
import { WorkShop } from "../workshop/workshop.model";
import { ENROLLMENT_STATUS, IEnrollment } from "./enrollment.interface";
import Enrollment from "./enrollment.model";

const createEnrollment = async (
  payload: Partial<IEnrollment>,
  userId: string,
) => {
  const transactionId = getTransactionId();
  const session = await Enrollment.startSession();
  session.startTransaction();

  try {
    if (!payload.workshop) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Workshop ID is required.");
    }

    if (typeof payload.workshop !== "string") {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Workshop ID must be a string.",
      );
    }
    const workshopId = payload.workshop;

    const user = await User.findById(userId).session(session);

    if (!user?.phone || !user.address) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Please update your profile to Enroll in a Workshop.",
      );
    }

    const workshop = await WorkShop.findById(workshopId)
      .select("price")
      .session(session);

    if (!workshop) {
      throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found.");
    }

    if (workshop.price == null) {
      throw new AppError(StatusCodes.BAD_REQUEST, "Workshop price is not set.");
    }

    if (!payload.studentCount || payload.studentCount <= 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Student count must be a positive number.",
      );
    }

    const amount = Number(workshop.price) * Number(payload.studentCount);
    if (isNaN(amount) || amount <= 0) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Invalid enrollment amount calculated.",
      );
    }

    const enrollment = await Enrollment.create(
      [
        {
          ...payload,
          user: userId,
          status: ENROLLMENT_STATUS.PENDING,
        },
      ],
      { session },
    );

    const payment = await Payment.create(
      [
        {
          enrollment: enrollment[0]._id,
          status: PAYMENT_STATUS.UNPAID,
          transactionId: transactionId,
          amount: amount,
        },
      ],
      { session },
    );

    const updatedEnrollment = await Enrollment.findByIdAndUpdate(
      enrollment[0]._id,
      {
        payment: payment[0]._id,
      },
      { new: true, runValidators: true, session },
    )
      .populate("user", "name email phone address")
      .populate("workshop", "title price")
      .populate("payment");

    const userAddress = (updatedEnrollment?.user as any).address;
    const userEmail = (updatedEnrollment?.user as any).email;
    const userPhoneNumber = (updatedEnrollment?.user as any).phone;
    const userName = (updatedEnrollment?.user as any).name;

    const sslPayload: ISSLCommerz = {
      address: userAddress,
      email: userEmail,
      phoneNumber: userPhoneNumber,
      name: userName,
      amount: amount,
      transactionId: transactionId,
    };

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    await session.commitTransaction();
    session.endSession();

    return {
      paymentUrl: sslPayment.GatewayPageURL,
      enrollment: updatedEnrollment,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getUserEnrollments = async () => {
  return {};
};

const getSingleEnrollment = async () => {
  return {};
};

const getAllEnrollments = async () => {
  return {};
};

const updateEnrollmentStatus = async () => {
  return {};
};

const EnrollmentService = {
  createEnrollment,
  getUserEnrollments,
  getSingleEnrollment,
  getAllEnrollments,
  updateEnrollmentStatus,
};

export default EnrollmentService;
