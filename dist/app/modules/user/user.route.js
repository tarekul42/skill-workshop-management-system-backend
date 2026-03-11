"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_controller_1 = __importDefault(require("./user.controller"));
const user_interface_1 = require("./user.interface");
const user_validation_1 = require("./user.validation");
const router = (0, express_1.Router)();
/**
 * @openapi
 * tags:
 *   name: User
 *   description: User management
 */
/**
 * @openapi
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "Abc123!"
 *                 description: "Must be at least 6 characters, contain 1 uppercase letter, 1 number, and 1 special character."
 *               phone:
 *                 type: string
 *                 example: "01712345678"
 *                 description: "Valid Bangladesh format: +8801XXXXXXXXX or 01XXXXXXXXX"
 *               age:
 *                 type: number
 *                 example: 25
 *               address:
 *                 type: string
 *                 example: "123 Main St, Dhaka"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/User" }
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/register", rateLimiter_1.authLimiter, (0, validateRequest_1.default)(user_validation_1.createUserZodSchema), user_controller_1.default.createUser);
/**
 * @openapi
 * /user/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/User" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.get("/me", rateLimiter_1.strictLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), user_controller_1.default.getMe);
/**
 * @openapi
 * /user/all-users:
 *   get:
 *     summary: Get all users
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/User" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get("/all-users", rateLimiter_1.strictLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), user_controller_1.default.getAllUsers);
/**
 * @openapi
 * /user/{id}:
 *   get:
 *     summary: Get single user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/User" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.get("/:id", rateLimiter_1.strictLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), user_controller_1.default.getSingleUser);
/**
 * @openapi
 * /user/{id}:
 *   patch:
 *     summary: Update user by ID
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               age:
 *                 type: number
 *               address:
 *                 type: string
 *               isActive:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, BLOCKED]
 *               role:
 *                 type: string
 *                 enum: [SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT]
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/User" }
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.patch("/:id", rateLimiter_1.strictLimiter, (0, validateRequest_1.default)(user_validation_1.updateUserZodSchema), (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), user_controller_1.default.updateUser);
const UserRoutes = router;
exports.default = UserRoutes;
