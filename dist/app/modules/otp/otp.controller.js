import { StatusCodes } from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import sendResponse from "../../utils/sendResponse.js";
import OTPService from "./otp.service.js";
const sendOtp = catchAsync(async (req, res) => {
    const { email, name } = req.body;
    await OTPService.sendOtp(email, name);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "OTP sent successfully",
        data: null,
    });
});
const verifyOtp = catchAsync(async (req, res) => {
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
