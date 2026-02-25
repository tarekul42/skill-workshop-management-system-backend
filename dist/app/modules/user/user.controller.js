"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = __importDefault(require("http-status-codes"));
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const user_service_1 = __importDefault(require("./user.service"));
const createUser = (0, catchAsync_1.default)(async (req, res) => {
    const user = await user_service_1.default.createUser(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "User created successfuly",
        data: user,
    });
});
const getSingleUser = (0, catchAsync_1.default)(async (req, res) => {
    const id = req.params.id;
    const result = await user_service_1.default.getSingleUser(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "User fetched successfully",
        data: result.data,
    });
});
const getMe = (0, catchAsync_1.default)(async (req, res) => {
    const decodedToken = req.user;
    const result = await user_service_1.default.getMe(decodedToken.userId);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "User fetched successfully",
        data: result.data,
    });
});
const getAllUsers = (0, catchAsync_1.default)(async (req, res) => {
    const query = req.query;
    const result = await user_service_1.default.getAllUsers(query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.OK,
        success: true,
        message: "Users fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});
const updateUser = (0, catchAsync_1.default)(async (req, res) => {
    const userId = req.params.id;
    const payload = req.body;
    const verifiedToken = req.user;
    const user = await user_service_1.default.updateUser(userId, payload, verifiedToken);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_codes_1.default.CREATED,
        success: true,
        message: "User updated successfuly",
        data: user,
    });
});
const UserControllers = {
    createUser,
    getSingleUser,
    getMe,
    getAllUsers,
    updateUser,
};
exports.default = UserControllers;
