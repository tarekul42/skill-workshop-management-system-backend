import { Types } from "mongoose";

export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  INSTRUCTOR = "INSTRUCTOR",
  STUDENT = "STUDENT",
}

export enum IsActive {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface IAuthProvider {
  provider: string;
  providerId: string;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  picture?: string;
  age?: number;
  address?: string;
  isDeleted?: boolean;
  isActive?: IsActive;
  isVerified?: boolean;
  role: UserRole;
  auths: IAuthProvider[];
  enrollments?: Types.ObjectId[];
  instructors?: Types.ObjectId[];
}
