import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, UserRole } from "./user.interface";
import User from "./user.model";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";

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
    Number(envVariables.BCRYPT_SALT_ROUND)
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

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (payload.role) {
    if (
      decodedToken.role === UserRole.STUDENT ||
      decodedToken.role === UserRole.INSTRUCTOR
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to change role"
      );
    }
    if (
      payload.role === UserRole.SUPER_ADMIN &&
      decodedToken.role === UserRole.ADMIN
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to assign SUPER_ADMIN role"
      );
    }

    if (payload.password) {
      payload.password = await bcrypt.hash(
        payload.password,
        envVariables.BCRYPT_SALT_ROUND
      );
    }

    const updatedUser = await User.findByIdAndUpdate(userId, payload, {
      new: true,
      runValidators: true,
    });

    return updatedUser;
  }
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
  updateUser,
  getAllUsers,
};

export default UserServices;
