import { Types } from "mongoose";
declare enum UserRole {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    INSTRUCTOR = "INSTRUCTOR",
    STUDENT = "STUDENT"
}
declare enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
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
export declare const isAdminRole: (role: string) => boolean;
export declare const isSuperAdmin: (role: string) => boolean;
export declare const isOwnResourceOrAdmin: (resourceUserId: string, tokenUserId: string, tokenRole: string) => boolean;
