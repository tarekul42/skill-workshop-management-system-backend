import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser } from "./user.interface";
import User from "./user.model";
import bcrypt from "bcryptjs";

const createUser = async (payload: Partial<IUser>) => {
  const { name, email, password, ...rest } = payload;

  if (typeof email !== "string" || email.trim().length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Valid email is required");
  }

  if (typeof password !== "string" || password.length === 0) {
    throw new AppError(StatusCodes.BAD_REQUEST, "Valid password is required");
  }

  const isUserExists = await User.findOne({ email: { $eq: email } });

  if (isUserExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already exists");
  }

  const authProvider: IAuthProvider = {
    provider: "credentials",
    providerId: email,
  };

  const hashedPassword = await bcrypt.hash(
    password,
    Number(envVariables.BCRYPT_SALT_ROUND),
  );

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    auths: [authProvider],
    ...rest,
  });

  return user;
};

const getAllUsers = async () => {
  const users = await User.find({});
  const totalUsers = await User.countDocuments();

  return {
    data: users,
    meta: {
      total: totalUsers,
    },
  };
};

const UserServices = {
  createUser,
  getAllUsers,
};

export default UserServices;
