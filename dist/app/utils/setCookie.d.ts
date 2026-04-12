import { Response } from "express";
interface IAuthTokens {
    accessToken?: string;
    refreshToken?: string;
}
declare const setAuthCookie: (res: Response, tokenInfo: IAuthTokens) => void;
export default setAuthCookie;
