import { Response } from "express";
import envVariables from "../config/env";

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
    });
  }
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "strict" : "lax",
    });
  }
};

export default setAuthCookie;
