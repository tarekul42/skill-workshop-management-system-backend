import bcrypt from "bcryptjs";
import { StatusCodes } from "http-status-codes";
import envVariables from "../../config/env";
import AppError from "../../errorHelpers/AppError";
import auditLogger from "../../utils/auditLogger";
import QueryBuilder from "../../utils/queryBuilder";
import { AuditAction } from "../audit/audit.interface";
import { userSearchableFields } from "./user.constant";
import { UserRole, isAdminRole, isSuperAdmin } from "./user.interface";
import User from "./user.model";
const createUser = async (payload) => {
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
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const hashedPassword = await bcrypt.hash(password, Number(envVariables.BCRYPT_SALT_ROUND));
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        auths: [authProvider],
        ...rest,
    });
    await auditLogger({
        action: AuditAction.CREATE,
        collectionName: "User",
        documentId: user._id,
    });
    return user;
};
const getSingleUser = async (id) => {
    const user = await User.findById(id);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    return { data: user };
};
const getMe = async (userId) => {
    const user = await User.findById(userId);
    return {
        data: user,
    };
};
const getAllUsers = async (query) => {
    const queryBuilder = new QueryBuilder(User.find(), query);
    const usersData = queryBuilder
        .search(userSearchableFields)
        .filter()
        .sort()
        .fields()
        .paginate();
    const [data, meta] = await Promise.all([
        usersData.build(),
        queryBuilder.getMeta(),
    ]);
    return {
        data,
        meta,
    };
};
const updateUser = async (userId, payload, decodedToken) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    const isAdmin = isAdminRole(decodedToken.role);
    const isOwnProfile = decodedToken.userId === userId;
    if (!isAdmin && !isOwnProfile) {
        throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to update this user");
    }
    const sanitizedPayload = {};
    if (payload.role) {
        if (!isAdminRole(decodedToken.role)) {
            throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to change role");
        }
        if (payload.role === UserRole.SUPER_ADMIN &&
            !isSuperAdmin(decodedToken.role)) {
            throw new AppError(StatusCodes.FORBIDDEN, "You are not authorized to assign SUPER_ADMIN role");
        }
        sanitizedPayload.role = payload.role;
    }
    if (payload.password) {
        sanitizedPayload.password = await bcrypt.hash(payload.password, Number(envVariables.BCRYPT_SALT_ROUND));
    }
    const sensitiveFields = ["isDeleted", "isActive", "isVerified", "role"];
    const allowedFields = ["name", "phone", "age", "address"];
    if (isAdmin) {
        allowedFields.push(...sensitiveFields);
    }
    for (const key of Object.keys(payload)) {
        if (key === "role" || key === "password")
            continue;
        if (key.startsWith("$"))
            continue;
        if (allowedFields.includes(key)) {
            const typedKey = key;
            sanitizedPayload[typedKey] = payload[typedKey];
        }
    }
    const updatedUser = await User.findByIdAndUpdate(userId, { $set: sanitizedPayload }, {
        returnDocument: "after",
        runValidators: true,
    });
    // Log sensitive changes (role and status) explicitly
    const auditChanges = {};
    if (sanitizedPayload.role)
        auditChanges.role = sanitizedPayload.role;
    if (sanitizedPayload.isActive !== undefined)
        auditChanges.isActive = sanitizedPayload.isActive;
    await auditLogger({
        action: AuditAction.UPDATE,
        collectionName: "User",
        documentId: userId,
        performedBy: decodedToken.userId,
        changes: auditChanges,
    });
    return updatedUser;
};
const deleteUser = async (userId, decodedToken) => {
    const isAdmin = isAdminRole(decodedToken.role);
    if (!isAdmin) {
        throw new AppError(StatusCodes.FORBIDDEN, "Only admins can delete users");
    }
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, "User not found");
    }
    if (user.role === UserRole.SUPER_ADMIN) {
        throw new AppError(StatusCodes.FORBIDDEN, "Cannot delete a SUPER_ADMIN account");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await user.softDelete();
    await auditLogger({
        action: AuditAction.DELETE,
        collectionName: "User",
        documentId: userId,
        performedBy: decodedToken.userId,
    });
    return null;
};
const UserServices = {
    createUser,
    getSingleUser,
    getMe,
    getAllUsers,
    updateUser,
    deleteUser,
};
export default UserServices;
