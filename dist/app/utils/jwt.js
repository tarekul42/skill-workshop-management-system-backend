import crypto from "crypto";
import jwt from "jsonwebtoken";
const generateToken = (payload, secret, expiresIn) => {
    const token = jwt.sign({ ...payload, jti: crypto.randomUUID() }, secret, {
        expiresIn,
    });
    return token;
};
const verifyToken = (token, secret) => {
    const verifiedToken = jwt.verify(token, secret);
    return verifiedToken;
};
export { generateToken, verifyToken };
