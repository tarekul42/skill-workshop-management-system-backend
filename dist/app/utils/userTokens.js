"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserTokens = exports.createNewAccessToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../config/env"));
const redis_config_1 = require("../config/redis.config");
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const jwt_1 = require("./jwt");
const parseExpiry_1 = require("./parseExpiry");
const hashToken = (token) => crypto_1.default.createHash("sha256").update(token).digest("hex");
const createUserTokens = async (user) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
    };
    const accessToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_ACCESS_SECRET, env_1.default.JWT_ACCESS_EXPIRES);
    const refreshToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_REFRESH_SECRET, env_1.default.JWT_REFRESH_EXPIRES);
    const hashedToken = hashToken(refreshToken);
    await redis_config_1.redisClient.set(`refresh_token:${user._id}`, hashedToken, {
        EX: (0, parseExpiry_1.parseExpiryToSeconds)(env_1.default.JWT_REFRESH_EXPIRES),
    });
    return { accessToken, refreshToken };
};
exports.createUserTokens = createUserTokens;
const createNewAccessToken = async (refreshToken) => {
    const verifiedPayload = (0, jwt_1.verifyToken)(refreshToken, env_1.default.JWT_REFRESH_SECRET);
    const userId = verifiedPayload.userId;
    const storedHashedToken = await redis_config_1.redisClient.get(`refresh_token:${userId}`);
    if (!storedHashedToken || storedHashedToken !== hashToken(refreshToken)) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.UNAUTHORIZED, "Invalid or expired refresh token");
    }
    await redis_config_1.redisClient.del(`refresh_token:${userId}`);
    const isUserExists = await user_model_1.default.findOne({ email: verifiedPayload.email });
    if (!isUserExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User does not exist");
    }
    if (isUserExists.isActive === user_interface_1.IsActive.INACTIVE ||
        isUserExists.isActive === user_interface_1.IsActive.BLOCKED) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, `User is ${isUserExists.isActive.toLowerCase()}.`);
    }
    if (isUserExists.isDeleted) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User is deleted");
    }
    const jwtPayload = {
        userId: isUserExists._id,
        email: isUserExists.email,
        role: isUserExists.role,
    };
    const accessToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_ACCESS_SECRET, env_1.default.JWT_ACCESS_EXPIRES);
    const newRefreshToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_REFRESH_SECRET, env_1.default.JWT_REFRESH_EXPIRES);
    const hashedNewToken = hashToken(newRefreshToken);
    await redis_config_1.redisClient.set(`refresh_token:${userId}`, hashedNewToken, {
        EX: (0, parseExpiry_1.parseExpiryToSeconds)(env_1.default.JWT_REFRESH_EXPIRES),
    });
    return { accessToken, refreshToken: newRefreshToken };
};
exports.createNewAccessToken = createNewAccessToken;
