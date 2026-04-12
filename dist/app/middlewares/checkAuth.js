import { StatusCodes } from "http-status-codes";
import envVariables from "../config/env.js";
import AppError from "../errorHelpers/AppError.js";
import { IsActive } from "../modules/user/user.interface.js";
import User from "../modules/user/user.model.js";
import { verifyToken } from "../utils/jwt.js";
import { isTokenBlacklisted } from "../utils/tokenBlacklist.js";
const checkAuth = (...authRoles) => async (req, _res, next) => {
    try {
        let accessToken = req.headers.authorization;
        if (!accessToken) {
            throw new AppError(StatusCodes.FORBIDDEN, "Access token is missing");
        }
        if (accessToken.startsWith("Bearer ")) {
            accessToken = accessToken.split(" ")[1];
        }
        const verifiedToken = verifyToken(accessToken, envVariables.JWT_ACCESS_SECRET);
        if (!verifiedToken) {
            throw new AppError(StatusCodes.FORBIDDEN, "Invalid access token");
        }
        const blacklisted = await isTokenBlacklisted(accessToken);
        if (blacklisted) {
            throw new AppError(StatusCodes.UNAUTHORIZED, "Token has been invalidated");
        }
        const isUserExists = await User.findOne({ email: verifiedToken.email });
        if (!isUserExists) {
            throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
        }
        if (!isUserExists.isVerified) {
            throw new AppError(StatusCodes.FORBIDDEN, "User is not verified");
        }
        if (isUserExists.isActive === IsActive.INACTIVE ||
            isUserExists.isActive === IsActive.BLOCKED) {
            throw new AppError(StatusCodes.FORBIDDEN, `User is ${isUserExists.isActive.toLowerCase()}.`);
        }
        if (isUserExists.isDeleted) {
            throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
        }
        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError(StatusCodes.FORBIDDEN, "Access denied");
        }
        req.user = verifiedToken;
        next();
    }
    catch (err) {
        next(err);
    }
};
export default checkAuth;
