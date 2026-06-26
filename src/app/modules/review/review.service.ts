import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError.js";
import auditLogger from "../../utils/auditLogger.js";
import { AuditAction } from "../audit/audit.interface.js";
import { ENROLLMENT_STATUS } from "../enrollment/enrollment.interface.js";
import Enrollment from "../enrollment/enrollment.model.js";
import { isAdminRole } from "../user/user.interface.js";
import { WorkShop } from "../workshop/workshop.model.js";
import {
  type IReview,
  type IReviewStats,
  REVIEW_STATUS,
} from "./review.interface.js";
import ReviewRepository from "./review.repository.js";

const createReview = async (payload: Partial<IReview>, userId: string) => {
  const workshopIdValue =
    payload.workshop instanceof Types.ObjectId
      ? payload.workshop.toString()
      : String(payload.workshop);

  if (!Types.ObjectId.isValid(workshopIdValue)) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Invalid workshop id");
  }

  const workshopObjectId = new Types.ObjectId(workshopIdValue);

  // Verify workshop exists
  const workshop = await WorkShop.findById(workshopObjectId);
  if (!workshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }
  if (workshop.isDeleted) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "This workshop is no longer available",
    );
  }

  // Verify user has an approved enrollment for this workshop
  const enrollment = await Enrollment.findOne({
    user: userId,
    workshop: workshopObjectId,
    status: {
      $in: [ENROLLMENT_STATUS.COMPLETE, ENROLLMENT_STATUS.PENDING],
    },
  });

  if (!enrollment) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You must be enrolled in this workshop to leave a review",
    );
  }

  // Check for duplicate review
  const existing = await ReviewRepository.findByUserAndWorkshop(
    userId,
    workshopObjectId.toString(),
  );
  if (existing) {
    throw new AppError(
      StatusCodes.CONFLICT,
      "You have already reviewed this workshop. You can edit your existing review.",
    );
  }

  const review = await ReviewRepository.create({
    ...payload,
    workshop: workshopObjectId,
    user: new Types.ObjectId(userId),
    status: REVIEW_STATUS.APPROVED,
  });

  const populated = await review.populate("user", "name picture");

  await auditLogger({
    action: AuditAction.CREATE,
    collectionName: "Review",
    documentId: review._id as unknown as string,
    performedBy: userId,
  });

  return populated;
};

const getWorkshopReviews = async (
  workshopId: string,
  page: number,
  limit: number,
  sort: string,
) => {
  // Verify workshop exists
  const workshop = await WorkShop.findById(workshopId);
  if (!workshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }

  return await ReviewRepository.findByWorkshop(workshopId, page, limit, sort);
};

const getWorkshopReviewStats = async (
  workshopId: string,
): Promise<IReviewStats> => {
  const workshop = await WorkShop.findById(workshopId);
  if (!workshop) {
    throw new AppError(StatusCodes.NOT_FOUND, "Workshop not found");
  }

  return await ReviewRepository.getStatsByWorkshop(workshopId);
};

const updateReview = async (
  reviewId: string,
  payload: Partial<IReview>,
  userId: string,
  userRole: string,
) => {
  const review = await ReviewRepository.findById(reviewId);
  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Only the review author or admin can update
  if (String(review.user) !== userId && !isAdminRole(userRole)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only edit your own reviews",
    );
  }

  const updated = await ReviewRepository.updateById(reviewId, payload);

  await auditLogger({
    action: AuditAction.UPDATE,
    collectionName: "Review",
    documentId: reviewId,
    performedBy: userId,
  });

  return updated;
};

const deleteReview = async (
  reviewId: string,
  userId: string,
  userRole: string,
) => {
  const review = await ReviewRepository.findById(reviewId);
  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, "Review not found");
  }

  // Only the review author or admin can delete
  if (String(review.user) !== userId && !isAdminRole(userRole)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "You can only delete your own reviews",
    );
  }

  await ReviewRepository.deleteById(reviewId);

  await auditLogger({
    action: AuditAction.DELETE,
    collectionName: "Review",
    documentId: reviewId,
    performedBy: userId,
  });

  return null;
};

const getUserReviewForWorkshop = async (workshopId: string, userId: string) => {
  return await ReviewRepository.findByUserAndWorkshop(userId, workshopId);
};

const updateReviewStatus = async (
  reviewId: string,
  status: REVIEW_STATUS,
  userId: string,
  userRole: string,
) => {
  if (!isAdminRole(userRole)) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      "Only admins can moderate reviews",
    );
  }

  const review = await ReviewRepository.findById(reviewId);
  if (!review) {
    throw new AppError(StatusCodes.NOT_FOUND, "Review not found");
  }

  const updated = await ReviewRepository.updateById(reviewId, {
    status,
  } as Partial<IReview>);

  await auditLogger({
    action: AuditAction.UPDATE,
    collectionName: "Review",
    documentId: reviewId,
    performedBy: userId,
    changes: { status },
  });

  return updated;
};

const ReviewService = {
  createReview,
  deleteReview,
  getUserReviewForWorkshop,
  getWorkshopReviewStats,
  getWorkshopReviews,
  updateReview,
  updateReviewStatus,
};

export default ReviewService;
