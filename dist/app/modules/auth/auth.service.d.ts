import { JwtPayload } from "jsonwebtoken";
declare const AuthServices: {
    getNewAccessToken: (refreshToken: string) => Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    changePassword: (oldPassword: string, newPassword: string, decodedToken: JwtPayload, accessToken: string) => Promise<void>;
    setPassword: (userId: string, plainPassword: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (newPassword: string, decodedToken: JwtPayload, accessToken: string) => Promise<void>;
};
export default AuthServices;
