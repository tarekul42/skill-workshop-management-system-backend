/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatusCodes from "http-status-codes";
import UserServices from "./user.service";

const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserServices.createUser(req.body);

    res
      .status(httpStatusCodes.CREATED)
      .json({ message: "User created successfuly", user });
  } catch (error: any) {
    res
      .status(httpStatusCodes.BAD_REQUEST)
      .json({ message: `Something went wrong!! ${error.message}` });
  }
};

const UserControllers = {
  createUser,
};

export default UserControllers;
