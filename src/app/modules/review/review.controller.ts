import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import ReviewService from "./review.service.js";

const createReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const payload = req.body;
  const result = await ReviewService.createReview(payload, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Review submitted successfully",
    data: result,
  });
});

const getWorkshopReviews = catchAsync(async (req: Request, res: Response) => {
  const workshopId = parseStringParam(req.params.workshopId, "workshopId");
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const sort = (req.query.sort as string) || "newest";

  const result = await ReviewService.getWorkshopReviews(
    workshopId,
    page,
    limit,
    sort,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Reviews fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getWorkshopReviewStats = catchAsync(async (req: Request, res: Response) => {
  const workshopId = parseStringParam(req.params.workshopId, "workshopId");
  const result = await ReviewService.getWorkshopReviewStats(workshopId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review stats fetched successfully",
    data: result,
  });
});

const updateReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const userRole = (req.user as JwtPayload).role as string;
  const reviewId = parseStringParam(req.params.reviewId, "reviewId");
  const payload = req.body;

  const result = await ReviewService.updateReview(
    reviewId,
    payload,
    userId,
    userRole,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review updated successfully",
    data: result,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const userRole = (req.user as JwtPayload).role as string;
  const reviewId = parseStringParam(req.params.reviewId, "reviewId");

  await ReviewService.deleteReview(reviewId, userId, userRole);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Review deleted successfully",
    data: null,
  });
});

const getUserReviewForWorkshop = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const workshopId = parseStringParam(req.params.workshopId, "workshopId");

  const result = await ReviewService.getUserReviewForWorkshop(
    workshopId,
    userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User review fetched successfully",
    data: result,
  });
});

const ReviewController = {
  createReview,
  deleteReview,
  getUserReviewForWorkshop,
  getWorkshopReviewStats,
  getWorkshopReviews,
  updateReview,
};

export default ReviewController;
