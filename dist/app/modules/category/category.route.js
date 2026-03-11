"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const category_controller_1 = __importDefault(require("./category.controller"));
const category_validation_1 = require("./category.validation");
const router = (0, express_1.Router)();
/**
 * @openapi
 * tags:
 *   name: Category
 *   description: Category management
 */
/**
 * @openapi
 * /category/create:
 *   post:
 *     summary: Create a new category
 *     tags: [Category]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 data:
 *                   type: object
 */
router.post("/create", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), multer_config_1.default.single("file"), (0, validateRequest_1.default)(category_validation_1.createCategoryZodSchema), category_controller_1.default.createCategory);
/**
 * @openapi
 * /category:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get("/", category_controller_1.default.getAllCategories);
/**
 * @openapi
 * /category/{slug}:
 *   get:
 *     summary: Get single category by slug
 *     tags: [Category]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 */
router.get("/:slug", category_controller_1.default.getSingleCategory);
/**
 * @openapi
 * /category/{id}:
 *   patch:
 *     summary: Update category by ID
 *     tags: [Category]
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 data:
 *                   type: object
 */
router.patch("/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), multer_config_1.default.single("file"), (0, validateRequest_1.default)(category_validation_1.updateCategoryZodSchema), category_controller_1.default.updateCategory);
/**
 * @openapi
 * /category/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags: [Category]
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
 *         description: Category deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category deleted successfully
 */
router.delete("/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), category_controller_1.default.deleteCategory);
const CategoryRoutes = router;
exports.default = CategoryRoutes;
