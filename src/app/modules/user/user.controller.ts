/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import httpStatusCodes from "http-status-codes";
import User from "./user.model";

const createUser = async (req: Request, res: Response) => {
  try {
    const { name, email } = req.body;
    const user = await User.create({
      name,
      email,
    });
    res
      .status(httpStatusCodes.CREATED)
      .json({ message: "User created successfuly", user });
  } catch (error: any) {
    res
      .status(httpStatusCodes.BAD_REQUEST)
      .json({ message: `Something went wrong!! ${error.message}` });
  }
};

export const UserController = {
  createUser,
};
