"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const auth_service_1 = __importDefault(require("./auth.service"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_codes_1 = require("http-status-codes");
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const creadentialsLogin = (0, catchAsync_1.default)(async (req, res) => {
    const loginInfo = await auth_service_1.default.credentialsLogin(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "Login successful",
        data: loginInfo,
    });
});
const getNewAccessToken = (0, catchAsync_1.default)(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "No refresh token found");
    }
    const tokenInfo = await auth_service_1.default.getNewAccessToken(refreshToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.StatusCodes.OK,
        success: true,
        message: "New access token generated successfully",
        data: tokenInfo,
    });
});
const AuthControllers = {
    creadentialsLogin,
    getNewAccessToken,
};
exports.default = AuthControllers;
