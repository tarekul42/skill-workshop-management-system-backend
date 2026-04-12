import { IUser } from "../modules/user/user.interface";
declare const createUserTokens: (user: Partial<IUser>) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
declare const createNewAccessToken: (refreshToken: string) => Promise<{
    accessToken: string;
    refreshToken: string;
}>;
export { createNewAccessToken, createUserTokens };
