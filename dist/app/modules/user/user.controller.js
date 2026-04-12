import StatusCodes from "http-status-codes";
import catchAsync from "../../utils/catchAsync.js";
import { parseStringParam } from "../../utils/parseParams.js";
import sendResponse from "../../utils/sendResponse.js";
import UserServices from "./user.service.js";
const createUser = catchAsync(async (req, res) => {
    const user = await UserServices.createUser(req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: "User created successfully",
        data: user,
    });
});
const getSingleUser = catchAsync(async (req, res) => {
    const id = parseStringParam(req.params.id, "id");
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User fetched successfully",
        data: result.data,
    });
});
const getMe = catchAsync(async (req, res) => {
    const decodedToken = req.user;
    const result = await UserServices.getMe(decodedToken.userId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User fetched successfully",
        data: result.data,
    });
});
const getAllUsers = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await UserServices.getAllUsers(query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "Users fetched successfully",
        data: result.data,
        meta: result.meta,
    });
});
const updateUser = catchAsync(async (req, res) => {
    const userId = parseStringParam(req.params.id, "id");
    const payload = req.body;
    const verifiedToken = req.user;
    const user = await UserServices.updateUser(userId, payload, verifiedToken);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User updated successfully",
        data: user,
    });
});
const deleteUser = catchAsync(async (req, res) => {
    const userId = parseStringParam(req.params.id, "id");
    const verifiedToken = req.user;
    await UserServices.deleteUser(userId, verifiedToken);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: "User deleted successfully",
        data: null,
    });
});
const UserControllers = {
    createUser,
    getSingleUser,
    getMe,
    getAllUsers,
    updateUser,
    deleteUser,
};
export default UserControllers;
