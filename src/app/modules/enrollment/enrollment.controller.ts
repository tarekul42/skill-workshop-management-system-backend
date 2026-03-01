import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ENROLLMENT_STATUS } from "./enrollment.interface";
import EnrollmentService from "./enrollment.service";

const createEnrollment = catchAsync(async (req: Request, res: Response) => {
  const userId = (req.user as JwtPayload).userId;
  const payload = req.body;
  const result = await EnrollmentService.createEnrollment(payload, userId);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Enrollment created successfully",
    data: {
      enrollment: result.enrollment,
      paymentUrl: result.paymentUrl,
    },
  });
});

const getUserEnrollments = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;

  const enrollments = await EnrollmentService.getUserEnrollments(
    decodeToken.userId,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollments fetched successfully",
    data: enrollments,
  });
});

const getSingleEnrollment = catchAsync(async (req: Request, res: Response) => {
  const decodeToken = req.user as JwtPayload;
  const enrollmentId = req.params.enrollmentId as string;

  const enrollment = await EnrollmentService.getSingleEnrollment(
    enrollmentId,
    decodeToken.userId,
    decodeToken.role,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollment fetched successfully",
    data: enrollment,
  });
});

const getAllEnrollments = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;

  const enrollments = await EnrollmentService.getAllEnrollments(
    query as Record<string, string>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Enrollments fetched successfully",
    data: enrollments,
    meta: enrollments.meta,
  });
});

const updateEnrollmentStatus = catchAsync(
  async (req: Request, res: Response) => {
    const decodeToken = req.user as JwtPayload;
    const enrollmentId = req.params.enrollmentId as string;
    const status = req.body.status as ENROLLMENT_STATUS;

    const updatedEnrollment = await EnrollmentService.updateEnrollmentStatus(
      enrollmentId,
      status,
      decodeToken.role,
    );

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
