import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError.js";
import auditLogger from "../../utils/auditLogger.js";
import QueryBuilder from "../../utils/queryBuilder.js";
import { AuditAction } from "../audit/audit.interface.js";
import { isAdminRole } from "../user/user.interface.js";
import { WorkShop } from "../workshop/workshop.model.js";
import {
  ENROLLMENT_STATUS,
  IEnrollment,
  IEnrollmentPopulated,
} from "./enrollment.interface.js";
import Enrollment from "./enrollment.model.js";
import EnrollmentRepository from "./enrollment.repository.js";

const createEnrollment = async (
  payload: Partial<IEnrollment>,
  userId: string,
) => {
  if (!payload.workshop) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Workshop ID is required.");
  }

  if (typeof payload.workshop !== "string") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Workshop ID must be a string.",
    );
  }

  const session = await EnrollmentRepository.startTransaction();

  try {
    const result = await EnrollmentRepository.createEnrollmentWithPayment(
      payload,
      userId,
      session,
    );

    await session.commitTransaction();
    session.endSession();

    await auditLogger({
      action: AuditAction.CREATE,
      collectionName: "Enrollment",
      documentId: result.enrollmentId,
      performedBy: userId,
    });

    return {
      paymentUrl: result.paymentUrl,
      enrollment: result.enrollment,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

const getUserEnrollments = async (userId: string) => {
  const enrollment = await Enrollment.find({ user: userId })
    .populate("user", "name email phone")
    .populate("workshop", "title price images location startDate")
    .populate("payment", "status amount transactionId");

  return {
    data: enrollment,
  };
};

const getSingleEnrollment = async (
  enrollmentId: string,
  userId: string,
  userRole: string,
) => {
  const enrollment = await Enrollment.findOne({
    _id: { $eq: new Types.ObjectId(enrollmentId) },
  })
    .populate("user", "name email phone address")
    .populate("workshop", "title price images location startDate endDate")
    .populate("payment", "status amount transactionId invoiceUrl");

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  const populatedEnrollment = enrollment as unknown as IEnrollmentPopulated;

  const isOwner =
    populatedEnrollment.user && String(populatedEnrollment.user._id) === userId;
  const isAdmin = isAdminRole(userRole);

  if (!isOwner && !isAdmin) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You are not authorized to view this enrollment",
    );
  }

  return populatedEnrollment;
};

const getAllEnrollments = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Enrollment.find(), query);

  const enrollmentsData = queryBuilder.filter().sort().fields().paginate();

  const [data, meta] = await Promise.all([
    enrollmentsData
      .build()
      .populate("user", "name email phone")
      .populate("workshop", "title price images location")
      .populate("payment", "status amount transactionId"),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const updateEnrollmentStatus = async (
  enrollmentId: string,
  status: ENROLLMENT_STATUS,
  userId: string,
  userRole: string,
) => {
  if (!isAdminRole(userRole)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only admins can update enrollment status",
    );
  }
  const allowedStatuses = Object.values(ENROLLMENT_STATUS);
  if (!allowedStatuses.includes(status)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid enrollment status");
  }

  const enrollment = await Enrollment.findOne({
    _id: { $eq: new Types.ObjectId(enrollmentId) },
  });

  if (!enrollment) {
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  if (enrollment.isDeleted) {
    throw new AppError(StatusCodes.GONE, "Enrollment has been deleted");
  }

  const updatedEnrollment = await Enrollment.findOneAndUpdate(
    { _id: { $eq: new Types.ObjectId(enrollmentId) } },
    { status },
    { returnDocument: "after", runValidators: true },
  )
    .populate("user", "name email phone")
    .populate("workshop", "title price")
    .populate("payment", "status amount transactionId");

  await auditLogger({
    action: AuditAction.UPDATE,
    collectionName: "Enrollment",
    documentId: enrollmentId,
    performedBy: userId,
    changes: { status },
  });

  return updatedEnrollment;
};

const cancelEnrollment = async (enrollmentId: string, userId: string) => {
  // Atomic: check ownership + status AND update in a single operation to prevent
  // both race conditions and write-then-authorize vulnerabilities.
  const updatedEnrollment = await Enrollment.findOneAndUpdate(
    {
      _id: new Types.ObjectId(enrollmentId),
      user: new Types.ObjectId(userId),
      status: { $in: [ENROLLMENT_STATUS.PENDING, ENROLLMENT_STATUS.COMPLETE] },
    },
    { status: ENROLLMENT_STATUS.CANCEL },
    { returnDocument: "after", runValidators: true },
  );

  if (!updatedEnrollment) {
    // Either not found or not PENDING/COMPLETE — determine which
    const existing = await Enrollment.findById(enrollmentId);
    if (!existing) {
      throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
    }
    if (existing.isDeleted) {
      throw new AppError(StatusCodes.GONE, "Enrollment has been deleted");
    }
    if (String(existing.user) !== userId) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You can only cancel your own enrollments",
      );
    }
    if (
      existing.status !== ENROLLMENT_STATUS.PENDING &&
      existing.status !== ENROLLMENT_STATUS.COMPLETE
    ) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Only pending or completed enrollments can be cancelled",
      );
    }
    throw new AppError(StatusCodes.NOT_FOUND, "Enrollment not found");
  }

  // Verify ownership
  if (String(updatedEnrollment.user) !== userId) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only cancel your own enrollments",
    );
  }

  // Decrement the workshop's currentEnrollments counter
  if (updatedEnrollment.workshop) {
    await WorkShop.findByIdAndUpdate(updatedEnrollment.workshop, {
      $inc: { currentEnrollments: -1 },
    });
  }

  await auditLogger({
    action: AuditAction.UPDATE,
    collectionName: "Enrollment",
    documentId: enrollmentId,
    performedBy: userId,
    changes: { status: ENROLLMENT_STATUS.CANCEL },
  });

  return updatedEnrollment;
};

const EnrollmentService = {
  createEnrollment,
  getUserEnrollments,
  getSingleEnrollment,
  getAllEnrollments,
  updateEnrollmentStatus,
  cancelEnrollment,
};

export default EnrollmentService;
