import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import AuthServices from "./auth.service";
import sendResponse from "../../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import AppError from "../../errorHelpers/AppError";
import setAuthCookie from "../../utils/setCookie";

const creadentialsLogin = catchAsync(async (req: Request, res: Response) => {
  const loginInfo = await AuthServices.credentialsLogin(req.body);

  setAuthCookie(res, loginInfo);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Login successful",
    data: loginInfo,
  });
});

const getNewAccessToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw new AppError(StatusCodes.BAD_REQUEST, "No refresh token found");
  }

  const tokenInfo = await AuthServices.getNewAccessToken(refreshToken);

  setAuthCookie(res, tokenInfo);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "New access token generated successfully",
    data: tokenInfo,
  });
});

const AuthControllers = {
  creadentialsLogin,
  getNewAccessToken,
};

export default AuthControllers;
