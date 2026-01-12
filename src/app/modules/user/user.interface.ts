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

export { UserRole, IsActive, IAuthProvider, IUser };
