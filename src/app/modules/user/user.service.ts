/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, UserRole } from "./user.interface";
import User from "./user.model";
import bcrypt from "bcryptjs";
import { JwtPayload } from "jsonwebtoken";
import QueryBuilder from "../../utils/queryBuilder";
import { userSearchableFields } from "./user.constant";

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

const getSingleUser = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  return { data: user };
};

const getAllUsers = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(User.find(), query);

  const usersData = queryBuilder
    .search(userSearchableFields)
    .filter()
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    usersData.build(),
    queryBuilder.getMeta,
  ]);

  return {
    data,
    meta,
  };
};

const updateUser = async (
  userId: string,
  payload: Partial<IUser>,
  decodedToken: JwtPayload,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  const sanitizedPayload: Partial<IUser> = {};

  if (payload.role) {
    if (
      decodedToken.role === UserRole.STUDENT ||
      decodedToken.role === UserRole.INSTRUCTOR
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to change role",
      );
    }
    if (
      payload.role === UserRole.SUPER_ADMIN &&
      decodedToken.role === UserRole.ADMIN
    ) {
      throw new AppError(
        StatusCodes.FORBIDDEN,
        "You are not authorized to assign SUPER_ADMIN role",
      );
    }
    sanitizedPayload.role = payload.role;
  }

  if (payload.password) {
    sanitizedPayload.password = await bcrypt.hash(
      payload.password,
      Number(envVariables.BCRYPT_SALT_ROUND),
    );
  }

  const allowedFields = [
    "name",
    "password",
    "phone",
    "age",
    "address",
    "isDeleted",
    "isActive",
    "isVerified",
    "role",
  ];

  for (const key of Object.keys(payload)) {
    if (key === "role" || key === "password") continue;

    if (key.startsWith("$")) continue;

    if (allowedFields.includes(key)) {
      const typedKey = key as keyof IUser;
      (sanitizedPayload as any)[typedKey] = payload[typedKey];
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: sanitizedPayload },
    {
      new: true,
      runValidators: true,
    },
  );

  return updatedUser;
};

const UserServices = {
  createUser,
  getSingleUser,
  getAllUsers,
  updateUser,
};

export default UserServices;
