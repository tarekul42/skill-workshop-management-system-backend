"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("./user.controller"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const user_validation_1 = require("./user.validation");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const user_interface_1 = require("./user.interface");
const router = (0, express_1.Router)();
router.post("/register", (0, validateRequest_1.default)(user_validation_1.createUserZodSchema), user_controller_1.default.createUser);
router.patch("/:id", (0, validateRequest_1.default)(user_validation_1.updateUserZodSchema), (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), user_controller_1.default.updateUser);
router.get("/all-users", (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), user_controller_1.default.getAllUsers);
const UserRoutes = router;
exports.default = UserRoutes;
