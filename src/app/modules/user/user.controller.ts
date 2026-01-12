/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from "express";
import StatusCodes from "http-status-codes";
import UserServices from "./user.service";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserServices.createUser(req.body);

    res
      .status(StatusCodes.CREATED)
      .json({ message: "User created successfuly", user });
  } catch (error: any) {
    next(error);
  }
};

const UserControllers = {
  createUser,
};

export default UserControllers;
