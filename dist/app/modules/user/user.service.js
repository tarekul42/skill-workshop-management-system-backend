"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_codes_1 = require("http-status-codes");
const env_1 = __importDefault(require("../../config/env"));
const AppError_1 = __importDefault(require("../../errorHelpers/AppError"));
const user_interface_1 = require("./user.interface");
const user_model_1 = __importDefault(require("./user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
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
const updateUser = async (userId, payload, decodedToken) => {
    const user = await user_model_1.default.findById(userId);
    if (!user) {
        throw new AppError_1.default(http_status_codes_1.StatusCodes.NOT_FOUND, "User not found");
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
const getAllUsers = async () => {
    const users = await user_model_1.default.find({});
    const totalUsers = await user_model_1.default.countDocuments();
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
exports.default = UserServices;
