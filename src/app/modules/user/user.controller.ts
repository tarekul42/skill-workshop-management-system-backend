import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import { JwtPayload } from "jsonwebtoken";
import catchAsync from "../../utils/catchAsync";
import { parseStringParam } from "../../utils/parseParams";
import sendResponse from "../../utils/sendResponse";
import UserServices from "./user.service";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfully",
    data: user,
  });
});

const getSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = parseStringParam(req.params.id, "id");
  const result = await UserServices.getSingleUser(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: result.data,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const decodedToken = req.user as JwtPayload;
  const result = await UserServices.getMe(decodedToken.userId);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User fetched successfully",
    data: result.data,
  });
});

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = req.query;
  const result = await UserServices.getAllUsers(
    query as Record<string, string>,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: result.data,
    meta: result.meta,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = parseStringParam(req.params.id, "id");
  const payload = req.body;
  const verifiedToken = req.user as JwtPayload;

  const user = await UserServices.updateUser(userId, payload, verifiedToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const userId = parseStringParam(req.params.id, "id");
  const verifiedToken = req.user as JwtPayload;

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
