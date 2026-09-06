import crypto from "crypto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const generateToken = (
  payload: JwtPayload,
  secret: string,
  expiresIn: string,
) => {
  // Preserve a caller-supplied jti (used to key refresh sessions);
  // otherwise generate one so every token has a unique identifier.
  const jti = payload.jti ?? crypto.randomUUID();
  const token = jwt.sign({ ...payload, jti }, secret, {
    expiresIn,
  } as SignOptions);
  return token;
};

const verifyToken = (token: string, secret: string) => {
  const verifiedToken = jwt.verify(token, secret) as JwtPayload;
  return verifiedToken;
};

export { generateToken, verifyToken };
