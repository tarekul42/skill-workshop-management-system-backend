import { Types } from "mongoose";

enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  INSTRUCTOR = "INSTRUCTOR",
  STUDENT = "STUDENT",
}

enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

interface IAuthProvider {
  provider: string;
  providerId: string;
}

interface IUser {
  _id?: Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  age?: number;
  address?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  isActive?: IsActive;
  isVerified?: boolean;
  role: UserRole;
  auths: IAuthProvider[];
  enrollments?: Types.ObjectId[];
  instructors?: Types.ObjectId[];
  createdAt?: Date;
}

export { IAuthProvider, IsActive, IUser, UserRole };

export const isAdminRole = (role: string): boolean =>
  role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

export const isSuperAdmin = (role: string): boolean =>
  role === UserRole.SUPER_ADMIN;

export const isOwnResourceOrAdmin = (
  resourceUserId: string,
  tokenUserId: string,
  tokenRole: string,
): boolean => resourceUserId === tokenUserId || isAdminRole(tokenRole);
