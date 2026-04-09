import envVariables from "../config/env";
import { parseExpiryToSeconds } from "./parseExpiry";
const setAuthCookie = (res, tokenInfo) => {
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
