import crypto from "crypto";
import fs from "fs";
import path from "path";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import passport from "passport";
import envVariables from "../../config/env.js";
import { redisClient } from "../../config/redis.config.js";
import AppError from "../../errorHelpers/AppError.js";
import catchAsync from "../../utils/catchAsync.js";
import logger from "../../utils/logger.js";
import sendResponse from "../../utils/sendResponse.js";
import setAuthCookie, { clearAuthCookie } from "../../utils/setCookie.js";
import { invalidateToken } from "../../utils/tokenBlacklist.js";
import { createUserTokens, revokeRefreshSession } from "../../utils/userTokens.js";
import { IUser } from "../user/user.interface.js";
import AuthServices from "./auth.service.js";

type TPassportError = Error | null;

interface IAuthInfo {
  code?: string;
  message?: string;
}

const extractAccessToken = (req: Request): string | undefined => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.split(" ")[1];
  }
  return req.cookies.accessToken;
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

const credentialsLogin = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;

    // Check account lockout before attempting authentication
    if (email) {
      const failKey = `failed_login:${email}`;
      const attempts = await redisClient.get(failKey);
      if (attempts && parseInt(attempts, 10) >= MAX_FAILED_ATTEMPTS) {
        throw new AppError(
          StatusCodes.TOO_MANY_REQUESTS,
          "Account temporarily locked due to too many failed attempts. Try again in 15 minutes.",
        );
      }
    }

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
          // Increment failed attempt counter
          if (email) {
            const failKey = `failed_login:${email}`;
            await redisClient.incr(failKey);
            await redisClient.expire(failKey, LOCKOUT_DURATION_SECONDS);
          }

          return next(
            new AppError(
              StatusCodes.UNAUTHORIZED,
              info?.message || "Incorrect email or password",
            ),
          );
        }

        // Successful login — clear failed attempts
        if (email) {
          await redisClient.del(`failed_login:${email}`);
        }

        const userTokens = await createUserTokens(user);

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

const logout = catchAsync(async (req: Request, res: Response) => {
  clearAuthCookie(res);

  const accessToken = extractAccessToken(req);

  if (accessToken) {
    await invalidateToken(accessToken, envVariables.JWT_ACCESS_SECRET);
  }

  // Revoke only THIS device's refresh session; other devices stay logged in.
  if (req.cookies?.refreshToken) {
    await revokeRefreshSession(req.cookies.refreshToken);
  }

  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        logger.error({ msg: "Session destroy error", err });
      }
    });
  }

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

  const accessToken = extractAccessToken(req);

  await AuthServices.changePassword(
    oldPassword,
    newPassword,
    decodedToken as JwtPayload,
    accessToken as string,
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
  const newPassword = req.body.newPassword;
  const decodedToken = req.user as JwtPayload;
  const resetToken = req.resetToken;

  await AuthServices.resetPassword(
    newPassword,
    decodedToken,
    resetToken as string,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Password reset successful",
    data: null,
  });
});

/**
 * Allowed redirect paths after OAuth — whitelist to prevent open redirects.
 */
const ALLOWED_REDIRECT_PATHS = [
  "dashboard",
  "profile",
  "settings",
  "workshops",
  "enrollments",
  "payments",
  "google/callback",
  "",
];

const googleCallback = catchAsync(async (req: Request, res: Response) => {
  // ── 1. Resolve redirect path from Redis (stored during /auth/google) ──
  let redirectTo = "";
  const stateParam = req.query.state as string | undefined;
  if (stateParam) {
    try {
      const storedRedirect = await redisClient.get(
        `oauth_redirect:${stateParam}`,
      );
      if (storedRedirect) {
        // Clean up
        await redisClient.del(`oauth_redirect:${stateParam}`);
        // Validate against whitelist
        const sanitized = storedRedirect
          .replace(/\\/g, "/")
          .replace(/^\/+/, "")
          .replace(/\/+$/, "");
        if (
          !sanitized.includes("://") &&
          !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(sanitized) &&
          ALLOWED_REDIRECT_PATHS.some(
            (p) => sanitized === p || sanitized.startsWith(p + "/"),
          )
        ) {
          redirectTo = sanitized;
        }
      }
    } catch (err) {
      logger.error({ msg: "Failed to retrieve OAuth redirect", err });
    }
  }

  // ── 2. Generate tokens for the authenticated user ──
  const user = req.user as unknown as Partial<IUser>;
  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User Not Found");
  }

  const tokenInfo = await createUserTokens(user);

  // Set httpOnly cookies for same-domain API calls
  setAuthCookie(res, tokenInfo);

  // ── 3. Generate a one-time authorization code (NOT the access token) ──
  // The frontend will exchange this code for the actual tokens via POST.
  // This avoids exposing the access token in browser URL bar / history / logs.
  const authCode = crypto.randomBytes(32).toString("hex");

  const codePayload = {
    accessToken: tokenInfo.accessToken,
    refreshToken: tokenInfo.refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: user.picture,
      isVerified: user.isVerified,
    },
  };

  try {
    // Store code → payload in Redis with short TTL (2 minutes)
    await redisClient.set(
      `auth_code:${authCode}`,
      JSON.stringify(codePayload),
      {
        EX: 120,
      },
    );
  } catch (err) {
    logger.error({ msg: "Failed to store auth code", err });
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Authentication service temporarily unavailable",
    );
  }

  // ── 4. Redirect to frontend with the one-time code (safe — code is useless without the exchange endpoint) ──
  res.redirect(`${envVariables.FRONTEND_URL}/${redirectTo}?code=${authCode}`);
});

/**
 * Exchange a one-time authorization code for tokens.
 * Called by the frontend after the OAuth redirect.
 * The code is consumed (deleted) after first use.
 */
const exchangeAuthCode = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code || typeof code !== "string") {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Authorization code is required",
    );
  }

  // Retrieve and immediately delete the code (one-time use) via atomic GETDEL
  let payload: string | null;
  try {
    payload = (await redisClient.getdel(`auth_code:${code}`)) as string | null;
  } catch (err) {
    logger.error({ msg: "Redis error during code exchange", err });
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Authentication service temporarily unavailable",
    );
  }

  if (!payload) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      "Invalid or expired authorization code",
    );
  }

  let tokenData: Record<string, unknown>;
  try {
    tokenData = JSON.parse(payload);
  } catch {
    throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, "Invalid token data");
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Tokens exchanged successfully",
    data: tokenData,
  });
});

const getDemoCredentials = catchAsync(async (_req: Request, res: Response) => {
  if (process.env.NODE_ENV === "production") {
    throw new AppError(StatusCodes.NOT_FOUND, "Demo credentials not available in production");
  }

  const credentialsFile = path.resolve(process.cwd(), ".seed-credentials.local.json");

  let credentials: unknown;
  try {
    credentials = JSON.parse(fs.readFileSync(credentialsFile, "utf-8"));
  } catch {
    throw new AppError(
      StatusCodes.NOT_FOUND,
      "No seeded demo credentials found. Run the seed script first (npm run seed).",
    );
  }

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Demo credentials fetched successfully",
    data: credentials,
  });
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
  exchangeAuthCode,
  getDemoCredentials,
};

export default AuthControllers;
