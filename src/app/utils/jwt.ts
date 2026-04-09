import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string,
) => {
  const token = jwt.sign(
    { ...payload, jti: crypto.randomUUID() },
    secret,
    { expiresIn } as SignOptions,
  );
  return token;
};

const verifyToken = (token: string, secret: string) => {
  const verifiedToken = jwt.verify(token, secret) as JwtPayload;
  return verifiedToken;
};

export { generateToken, verifyToken };
