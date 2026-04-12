import jwt, { JwtPayload } from "jsonwebtoken";
declare const generateToken: (payload: JwtPayload, secret: string, expiresIn: string) => string;
declare const verifyToken: (token: string, secret: string) => jwt.JwtPayload;
export { generateToken, verifyToken };
