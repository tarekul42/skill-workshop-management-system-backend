import { Response } from "express";

interface IAuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

const setAuthCookie = (res: Response, tokenInfo: IAuthTokens) => {
  if (tokenInfo.accessToken) {
    res.cookie("accessToken", tokenInfo.accessToken, {
      httpOnly: true,
      secure: false,
    });
  }
  if (tokenInfo.refreshToken) {
    res.cookie("refreshToken", tokenInfo.refreshToken, {
      httpOnly: true,
      secure: false,
    });
  }
};

export default setAuthCookie;
