import { Request, Response } from "express";
import StatusCodes from "http-status-codes";
import UserServices from "./user.service";
import catchAsync from "../../utils/catchAsync";

const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await UserServices.createUser(req.body);

  res
    .status(StatusCodes.CREATED)
    .json({ message: "User created successfuly", user });
});

const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await UserServices.getAllUsers();
  res.status(StatusCodes.OK).json({
    message: `all(${users.length}) Users fetched successfully`,
    users,
  });
});

const UserControllers = {
  createUser,
  getAllUsers,
};

export default UserControllers;
