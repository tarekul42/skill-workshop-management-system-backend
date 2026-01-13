"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const user_model_1 = __importDefault(require("./user.model"));
const createUser = async (payload) => {
    const { name, email } = payload;
    const user = await user_model_1.default.create({
        name,
        email,
    });
    return user;
};
const getAllUsers = async () => {
    const users = await user_model_1.default.find();
    return users;
};
const UserServices = {
    createUser,
    getAllUsers,
};
exports.default = UserServices;
//# sourceMappingURL=user.service.js.map