import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import EnrollmentService from "./enrollment.service";

const createEnrollment = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;

  const enrollment = await EnrollmentService.createEnrollment(
    req.body,
    decodeToken.userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Enrollment created successfully",
    data: enrollment,
  });
});

const getUserEnrollments = catchAsync(async (req: Request, res: Response) => {
  const enrollments = await EnrollmentService.getUserEnrollments();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollments fetched successfully",
    data: enrollments,
  });
});

const getSingleEnrollment = catchAsync(async (req: Request, res: Response) => {
  const enrollment = await EnrollmentService.getSingleEnrollment();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollment fetched successfully",
    data: enrollment,
  });
});

const getAllEnrollments = catchAsync(async (req: Request, res: Response) => {
  const enrollments = await EnrollmentService.getAllEnrollments();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollments fetched successfully",
    data: enrollments,
  });
});

const updateEnrollmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const updatedEnrollment = await EnrollmentService.updateEnrollmentStatus();

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Enrollment status updated successfully",
      data: updatedEnrollment,
    });
  },
);

const EnrollmentController = {
  createEnrollment,
  getUserEnrollments,
  getSingleEnrollment,
  getAllEnrollments,
  updateEnrollmentStatus,
};

export default EnrollmentController;
