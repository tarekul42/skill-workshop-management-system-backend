"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../../config/env"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const queryBuilder_1 = __importDefault(require("../../utils/queryBuilder"));
const user_constant_1 = require("./user.constant");
const user_interface_1 = require("./user.interface");
const user_model_1 = __importDefault(require("./user.model"));
const createUser = async (payload) => {
    const { name, email, password, ...rest } = payload;
    if (typeof email !== "string" || email.trim().length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Valid email is required");
    }
    if (typeof password !== "string" || password.length === 0) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "Valid password is required");
    }
    const isUserExists = await user_model_1.default.findOne({ email: { $eq: email } });
    if (isUserExists) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.BAD_REQUEST, "User already exists");
    }
    const authProvider = {
        provider: "credentials",
        providerId: email,
    };
    const hashedPassword = await bcryptjs_1.default.hash(password, Number(env_1.default.BCRYPT_SALT_ROUND));
    const user = await user_model_1.default.create({
        name,
        email,
        password: hashedPassword,
        auths: [authProvider],
        ...rest,
    });
    return user;
};
const getSingleUser = async (id) => {
    const user = await user_model_1.default.findById(id);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    return { data: user };
};
const getMe = async (userId) => {
    const user = await user_model_1.default.findById(userId);
    return {
        data: user,
    };
};
const getAllUsers = async (query) => {
    const queryBuilder = new queryBuilder_1.default(user_model_1.default.find(), query);
    const usersData = queryBuilder
        .search(user_constant_1.userSearchableFields)
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
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
    }
    const isAdmin = decodedToken.role === user_interface_1.UserRole.ADMIN ||
        decodedToken.role === user_interface_1.UserRole.SUPER_ADMIN;
    const isOwnProfile = decodedToken.userId === userId;
    if (!isAdmin && !isOwnProfile) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to update this user");
    }
    const sanitizedPayload = {};
    if (payload.role) {
        if (decodedToken.role === user_interface_1.UserRole.STUDENT ||
            decodedToken.role === user_interface_1.UserRole.INSTRUCTOR) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to change role");
        }
        if (payload.role === user_interface_1.UserRole.SUPER_ADMIN &&
            decodedToken.role === user_interface_1.UserRole.ADMIN) {
            throw new AppError_1.default(http_status_codes_1.StatusCodes.FORBIDDEN, "You are not authorized to assign SUPER_ADMIN role");
        }
        sanitizedPayload.role = payload.role;
    }
    if (payload.password) {
        sanitizedPayload.password = await bcryptjs_1.default.hash(payload.password, Number(env_1.default.BCRYPT_SALT_ROUND));
    }
    const sensitiveFields = ["isDeleted", "isActive", "isVerified", "role"];
    const allowedFields = [
        "name",
        "password",
        "phone",
        "age",
        "address",
    ];
    if (isAdmin) {
        allowedFields.push(...sensitiveFields);
    }
    else if (isOwnProfile) {
        allowedFields.push("name", "phone", "age", "address");
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
    const updatedUser = await user_model_1.default.findByIdAndUpdate(userId, { $set: sanitizedPayload }, {
        new: true,
        runValidators: true,
    });
    return updatedUser;
};
const UserServices = {
    createUser,
    getSingleUser,
    getMe,
    getAllUsers,
    updateUser,
};
exports.default = UserServices;
