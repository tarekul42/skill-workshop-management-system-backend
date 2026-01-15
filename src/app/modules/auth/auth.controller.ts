import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import AuthServices from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";

const creadentialsLogin = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = await AuthServices.credentialsLogin(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: loginInfo,
  });
});

const AuthControllers = {
  creadentialsLogin,
};

export default AuthControllers;
