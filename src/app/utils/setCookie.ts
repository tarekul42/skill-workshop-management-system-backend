import { Response } from "express";
import envVariables from "../config/env.js";
import { parseExpiryToSeconds } from "./parseExpiry.js";

interface IAuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const setAuthCookie = (res: Response, tokenInfo: IAuthTokens) => {
  const isProduction = envVariables.NODE_ENV === "production";
  // SameSite is env-driven (COOKIE_SAMESITE, default "lax").
  // Only set "none" when the frontend runs on a DIFFERENT site than this API —
  // "none" requires Secure and widens cross-site exposure.
  const sameSite = envVariables.COOKIE_SAMESITE;

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: parseExpiryToSeconds(envVariables.JWT_ACCESS_EXPIRES) * 1000,
      path: "/",
    });
  }
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite,
      maxAge: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES) * 1000,
      path: "/",
    });
  }
};

const clearAuthCookie = (res: Response) => {
  const isProduction = envVariables.NODE_ENV === "production";
  const sameSite = envVariables.COOKIE_SAMESITE;

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite,
    path: "/",
  });
};

export { clearAuthCookie };
export default setAuthCookie;
