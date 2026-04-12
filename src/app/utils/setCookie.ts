import { Response } from "express";
import envVariables from "../config/env.js";
import { parseExpiryToSeconds } from "./parseExpiry.js";

interface IAuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const setAuthCookie = (res: Response, tokenInfo: IAuthTokens) => {
  const isProduction = envVariables.NODE_ENV === "production";

  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: parseExpiryToSeconds(envVariables.JWT_ACCESS_EXPIRES) * 1000,
      path: "/",
    });
  }
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
      maxAge: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES) * 1000,
      path: "/",
    });
  }
};

export default setAuthCookie;
