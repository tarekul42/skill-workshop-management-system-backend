"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const payment_interface_1 = require("../payment/payment.interface");
const payment_model_1 = __importDefault(require("../payment/payment.model"));
const user_model_1 = __importDefault(require("../user/user.model"));
const workshop_model_1 = require("../workshop/workshop.model");
const enrollment_interface_1 = require("./enrollment.interface");
const enrollment_model_1 = __importDefault(require("./enrollment.model"));
const getTransactionId = () => {
    return `tran_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};
const createEnrollment = async (payload, userId) => {
    const transactionId = getTransactionId();
    const session = await enrollment_model_1.default.startSession();
    session.startTransaction();
    try {
        if (!payload.workshop) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID is required.");
        }
        if (typeof payload.workshop !== "string") {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop ID must be a string.");
        }
        const workshopId = payload.workshop;
        const user = await user_model_1.default.findById(userId).session(session);
        if (!user?.phone || !user.address) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Please update your profile to Enroll in a Workshop.");
        }
        const workshop = await workshop_model_1.WorkShop.findById(workshopId)
            .select("price")
            .session(session);
        if (!workshop) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "Workshop not found.");
        }
        if (workshop.price == null) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Workshop price is not set.");
        }
        if (!payload.studentCount || payload.studentCount <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Student count must be a positive number.");
        }
        const amount = Number(workshop.price) * Number(payload.studentCount);
        if (isNaN(amount) || amount <= 0) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Invalid enrollment amount calculated.");
        }
        const enrollment = await enrollment_model_1.default.create([
            {
                ...payload,
                user: userId,
                status: enrollment_interface_1.ENROLLMENT_STATUS.PENDING,
            },
        ], { session });
        const payment = await payment_model_1.default.create([
            {
                enrollment: enrollment[0]._id,
                status: payment_interface_1.PAYMENT_STATUS.UNPAID,
                transactionId: transactionId,
                amount: amount,
            },
        ], { session });
        const updatedEnrollment = await enrollment_model_1.default.findByIdAndUpdate(enrollment[0]._id, {
            payment: payment[0]._id,
        }, { new: true, runValidators: true, session })
            .populate("user", "name email phone address")
            .populate("workshop", "title price")
            .populate("payment");
        await session.commitTransaction();
        session.endSession();
        return {
            enrollment: updatedEnrollment,
        };
    }
    catch (err) {
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
exports.default = EnrollmentService;
