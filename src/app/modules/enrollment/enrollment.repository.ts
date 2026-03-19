import { StatusCodes } from "http-status-codes";
import { ClientSession } from "mongoose";
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

const startTransaction = async () => {
  const session = await Enrollment.startSession();
  session.startTransaction();
  return session;
};

const findUserById = async (userId: string, session: ClientSession) => {
  return await User.findById(userId).session(session);
};

const findWorkshopById = async (workshopId: string, session: ClientSession) => {
  return await WorkShop.findById(workshopId).select("price").session(session);
};

const createEnrollmentWithPayment = async (
  payload: Partial<IEnrollment>,
  userId: string,
  session: ClientSession,
) => {
  const transactionId = getTransactionId();

  const user = await findUserById(userId, session);
  if (!user?.phone || !user.address) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Please update your profile to Enroll in a Workshop.",
    );
  }

  const workshopId = String(payload.workshop);
  const workshop = await findWorkshopById(workshopId, session);
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

  const [enrollment] = await Enrollment.create(
    [{ ...payload, user: userId, status: ENROLLMENT_STATUS.PENDING }],
    { session },
  );

  const [payment] = await Payment.create(
    [
      {
        enrollment: enrollment._id,
        status: PAYMENT_STATUS.UNPAID,
        transactionId,
        amount,
      },
    ],
    { session },
  );

  const updatedEnrollment = await Enrollment.findByIdAndUpdate(
    enrollment._id,
    { payment: payment._id },
    { returnDocument: "after", runValidators: true, session },
  )
    .populate("user", "name email phone address")
    .populate("workshop", "title price")
    .populate("payment");

  const sslPayload: ISSLCommerz = {
    address: user.address as string,
    email: user.email,
    phoneNumber: user.phone as string,
    name: user.name,
    amount,
    transactionId,
  };

  const sslPayment = await SSLService.sslPaymentInit(sslPayload);

  return {
    enrollmentId: enrollment._id,
    paymentUrl: sslPayment.GatewayPageURL,
    enrollment: updatedEnrollment,
  };
};

const EnrollmentRepository = {
  startTransaction,
  createEnrollmentWithPayment,
};

export default EnrollmentRepository;
