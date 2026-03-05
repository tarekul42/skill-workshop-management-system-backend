import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import OTPService from "./otp.service";

const sendOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  await OTPService.sendOtp(email, name);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "OTP sent successfully",
    data: null,
  });
});

const verifyOtp = catchAsync(async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  await OTPService.verifyOtp(email, otp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "OTP verified successfully",
    data: null,
  });
});

const OTPController = {
  sendOtp,
  verifyOtp,
};

export default OTPController;
