import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError.js";
import { getTransactionId } from "../../utils/getTransactionId.js";
import { PAYMENT_STATUS } from "../payment/payment.interface.js";
import Payment from "../payment/payment.model.js";
import SSLService from "../sslCommerz/sslCommerz.service.js";
import User from "../user/user.model.js";
import { WorkShop } from "../workshop/workshop.model.js";
import { ENROLLMENT_STATUS } from "./enrollment.interface.js";
import Enrollment from "./enrollment.model.js";
const startTransaction = async () => {
    const session = await Enrollment.startSession({
        defaultTransactionOptions: {
            readConcern: { level: "snapshot" },
            writeConcern: { w: "majority" },
        },
    });
    session.startTransaction();
    return session;
};
const findWorkshopById = async (workshopId, session) => {
    return await WorkShop.findById(workshopId)
        .select("price maxSeats")
        .session(session);
};
const createEnrollmentWithPayment = async (payload, userId, session) => {
    const transactionId = getTransactionId();
    const user = await User.findById(userId).session(session);
    if (!user?.phone || !user.address) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Please update your profile to Enroll in a Workshop.");
    }
    const workshopId = String(payload.workshop);
    const workshop = await findWorkshopById(workshopId, session);
    if (!workshop) {
        throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found.");
    }
    if (workshop.price == null) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Workshop price is not set.");
    }
    // Guard: Prevent duplicate active enrollment for this user + workshop
    const existingEnrollment = await Enrollment.findOne({
        user: { $eq: userId },
        workshop: { $eq: workshopId },
        status: { $in: ["PENDING", "COMPLETE"] },
    }).session(session);
    if (existingEnrollment) {
        throw new AppError(StatusCodes.BAD_REQUEST, "You already have an active enrollment for this workshop.");
    }
    // Atomic capacity check using findOneAndUpdate
    // This prevents TOCTOU race conditions under high concurrency
    if (workshop.maxSeats != null) {
        const workshopWithCapacity = await WorkShop.findOneAndUpdate({
            _id: { $eq: workshopId },
            currentEnrollments: { $lt: workshop.maxSeats },
        }, { $inc: { currentEnrollments: 1 } }, { session, returnDocument: "after" });
        if (!workshopWithCapacity) {
            throw new AppError(StatusCodes.BAD_REQUEST, "This workshop is fully booked. No seats available.");
        }
    }
    if (!payload.studentCount || payload.studentCount <= 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Student count must be a positive number.");
    }
    const amount = Number(workshop.price) * Number(payload.studentCount);
    if (isNaN(amount) || amount <= 0) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment amount calculated.");
    }
    const [enrollment] = await Enrollment.create([{ ...payload, user: userId, status: ENROLLMENT_STATUS.PENDING }], { session });
    const [payment] = await Payment.create([
        {
            enrollment: enrollment._id,
            status: PAYMENT_STATUS.UNPAID,
            transactionId,
            amount,
        },
    ], { session });
    const updatedEnrollment = await Enrollment.findByIdAndUpdate(enrollment._id, { payment: payment._id }, { returnDocument: "after", runValidators: true, session })
        .populate("user", "name email phone address")
        .populate("workshop", "title price")
        .populate("payment");
    const sslPayload = {
        address: user.address,
        email: user.email,
        phoneNumber: user.phone,
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
