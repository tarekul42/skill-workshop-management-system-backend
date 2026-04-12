import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { authLimiter, strictLimiter } from "../../utils/rateLimiter.js";
import UserControllers from "./user.controller.js";
import { UserRole } from "./user.interface.js";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation.js";
const router = Router();
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post("/register", authLimiter, validateRequest(createUserZodSchema), UserControllers.createUser);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get("/me", strictLimiter, checkAuth(...Object.values(UserRole)), UserControllers.getMe);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/all-users", strictLimiter, checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserControllers.getAllUsers);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get("/:id", strictLimiter, checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserControllers.getSingleUser);
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
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.patch("/:id", strictLimiter, validateRequest(updateUserZodSchema), checkAuth(...Object.values(UserRole)), UserControllers.updateUser);
/**
 * @openapi
 * /user/{id}:
 *   delete:
 *     summary: Soft-delete a user by ID
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
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.delete("/:id", strictLimiter, checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), UserControllers.deleteUser);
const UserRoutes = router;
export default UserRoutes;
