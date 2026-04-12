import { Router } from "express";
import multerUpload from "../../config/multer.config.js";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { adminCrudLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import CategoryController from "./category.controller.js";
import {
  createCategoryZodSchema,
  updateCategoryZodSchema,
} from "./category.validation.js";

const router = Router();

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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Category" }
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
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post(
  "/create",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single("file"),
  validateRequest(createCategoryZodSchema),
  CategoryController.createCategory,
);

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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Category" }
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/", CategoryController.getAllCategories);

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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Category" }
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/:slug", CategoryController.getSingleCategory);

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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Category" }
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
router.patch(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.single("file"),
  validateRequest(updateCategoryZodSchema),
  CategoryController.updateCategory,
);

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
 *               $ref: "#/components/schemas/BaseResponse"
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
router.delete(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.deleteCategory,
);

const CategoryRoutes = router;

export default CategoryRoutes;
