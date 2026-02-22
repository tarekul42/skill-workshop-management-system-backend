"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = __importDefault(require("../config/env"));
const user_interface_1 = require("../modules/user/user.interface");
const user_model_1 = __importDefault(require("../modules/user/user.model"));
const seedSuperAdmin = async () => {
    try {
        const isSuperAdminExists = await user_model_1.default.findOne({
            email: env_1.default.SUPER_ADMIN_EMAIL,
        });
        if (isSuperAdminExists) {
            console.log("Super Admin already exists!");
            return;
        }
        const hashedPassword = await bcryptjs_1.default.hash(env_1.default.SUPER_ADMIN_PASSWORD, Number(env_1.default.BCRYPT_SALT_ROUND));
        const authProvider = {
            provider: "credentials",
            providerId: env_1.default.SUPER_ADMIN_EMAIL,
        };
        const payload = {
            name: "Super Admin",
            role: user_interface_1.UserRole.SUPER_ADMIN,
            email: env_1.default.SUPER_ADMIN_EMAIL,
            password: hashedPassword,
            isVerified: true,
            auths: [authProvider],
        };
        await user_model_1.default.create(payload);
    }
    catch (err) {
        console.error(err);
    }
};
exports.default = seedSuperAdmin;
