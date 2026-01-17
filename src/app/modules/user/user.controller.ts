import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import UserServices from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { JwtPayload } from "jsonwebtoken";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User created successfuly",
    data: user,
  });
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const payload = req.body;
  const verifiedToken = req.user as JwtPayload;

  const user = await UserServices.updateUser(userId, payload, verifiedToken);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "User updated successfuly",
    data: user,
  });
});

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await UserServices.getAllUsers();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users fetched successfully",
    data: users.data,
    meta: users.meta,
  });
});

const UserControllers = {
  createUser,
  updateUser,
  getAllUsers,
};

export default UserControllers;
