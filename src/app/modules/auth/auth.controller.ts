import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import setAuthCookie from "../../utils/setCookie";
import { createUserTokens } from "../../utils/userTokens";
import { IUser } from "../user/user.interface";
import AuthServices from "./auth.service";

type TPassportError = Error | null;

interface IAuthInfo {
  message: string;
}

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(
      "local",
      { session: false },
      async (err: TPassportError, user: IUser, info: IAuthInfo) => {
        if (err) {
          return next(
            new AppError(
              StatusCodes.INTERNAL_SERVER_ERROR,
              "Something went wrong during authentication.",
            ),
          );
        }

        if (!user) {
          return next(
            new AppError(
              StatusCodes.UNAUTHORIZED,
              info?.message || "Incorrect email or password",
            ),
          );
        }

        const userTokens = createUserTokens(user);

        setAuthCookie(res, userTokens);

        sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: "User logged in successfully",
          data: {
            accessToken: userTokens.accessToken,
            refreshToken: userTokens.refreshToken,
            user,
          },
        });
      },
    )(req, res, next);
  },
);

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

const logout = catchAsync(async (_req: Request, res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
  });

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Logout successful",
    data: null,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const newPassword = req.body.newPassword;
  const oldPassword = req.body.oldPassword;
  const decodedToken = req.user;

  await AuthServices.changePassword(
    oldPassword,
    newPassword,
    decodedToken as JwtPayload,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password changed successfully",
    data: null,
  });
});

const setPassword = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const { password } = req.body;

  await AuthServices.setPassword(decodedToken.userId, password);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Password set successfully",
    data: null,
  });
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const { email } = req.body;

  await AuthServices.forgotPassword(email);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: "Email has been sent",
    data: null,
  });
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const decodedToken = req.user as JwtPayload;

  await AuthServices.resetPassword(oldPassword, newPassword, decodedToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password reset successful",
    data: null,
  });
});

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  const stateParam = req.query.state;
  let redirectTo = "";

  if (typeof stateParam === "string") {
    // Normalize backslashes and strip leading slashes for relative path
    const sanitized = stateParam.replace(/\\/g, "/").replace(/^\/+/, "");

    // Reject if it looks like an absolute URL (contains protocol)
    if (
      !sanitized.includes("://") &&
      !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitized)
    ) {
      redirectTo = sanitized;
    }
  }

  const user = req.user as unknown as Partial<IUser>;

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  const tokenInfo = createUserTokens(user);

  setAuthCookie(res, tokenInfo);
  res.redirect(`${envVariables.FRONTEND_URL}/${redirectTo}`);
});

const AuthControllers = {
  credentialsLogin,
  getNewAccessToken,
  logout,
  changePassword,
  setPassword,
  forgotPassword,
  resetPassword,
  googleCallback,
};

export default AuthControllers;
