"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = __importDefault(require("./user.controller"));
const router = (0, express_1.Router)();
router.post("/register", user_controller_1.default.createUser);
router.get("/all-users", user_controller_1.default.getAllUsers);
const UserRoutes = router;
exports.default = UserRoutes;
//# sourceMappingURL=user.routes.js.map