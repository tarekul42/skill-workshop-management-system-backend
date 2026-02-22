"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserTokens = exports.createNewAccessToken = void 0;
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../config/env"));
const AppError_1 = __importDefault(require("../errorHelpers/AppError"));
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const jwt_1 = require("./jwt");
const createUserTokens = (user) => {
    const jwtPayload = {
        userId: user._id,
        email: user.email,
        role: user.role,
    };
    const accessToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_ACCESS_SECRET, env_1.default.JWT_ACCESS_EXPIRES);
    const refreshToken = (0, jwt_1.generateToken)(jwtPayload, env_1.default.JWT_REFRESH_SECRET, env_1.default.JWT_REFRESH_EXPIRES);
    return { accessToken, refreshToken };
};
exports.createUserTokens = createUserTokens;
const createNewAccessToken = async (refreshToken) => {
    const verifiedPayload = (0, jwt_1.verifyToken)(refreshToken, env_1.default.JWT_REFRESH_SECRET);
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
    return accessToken;
};
exports.createNewAccessToken = createNewAccessToken;
