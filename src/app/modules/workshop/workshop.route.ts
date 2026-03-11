import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { adminCrudLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import WorkshopController from "./workshop.controller";
import {
  createLevelZodSchema,
  createWorkshopZodSchema,
  updateWorkshopZodSchema,
} from "./workshop.validation";
import multerUpload from "../../config/multer.config";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   - name: Workshop
 *     description: Workshop management
 *   - name: Level
 *     description: Workshop levels management
 */

// levels routes
/**
 * @openapi
 * /workshop/levels:
 *   get:
 *     summary: Get all workshop levels
 *     tags: [Level]
 *     responses:
 *       200:
 *         description: Levels retrieved successfully
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
router.get("/levels", WorkshopController.getAllLevels);

/**
 * @openapi
 * /workshop/levels/{id}:
 *   get:
 *     summary: Get single level by ID
 *     tags: [Level]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Level retrieved successfully
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
router.get("/levels/:id", WorkshopController.getSingleLevel);

/**
 * @openapi
 * /workshop/create-level:
 *   post:
 *     summary: Create a new level
 *     tags: [Level]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Level created successfully
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
 *                   example: Level created successfully
 *                 data:
 *                   type: object
 */
router.post(
  "/create-level",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.createLevel,
);

/**
 * @openapi
 * /workshop/levels/{id}:
 *   patch:
 *     summary: Update level by ID
 *     tags: [Level]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Level updated successfully
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
 *                   example: Level updated successfully
 *                 data:
 *                   type: object
 */
router.patch(
  "/levels/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.updateLevel,
);

/**
 * @openapi
 * /workshop/levels/{id}:
 *   delete:
 *     summary: Delete level by ID
 *     tags: [Level]
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
 *         description: Level deleted successfully
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
 *                   example: Level deleted successfully
 */
router.delete(
  "/levels/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteLevel,
);

// workshop routes
/**
 * @openapi
 * /workshop:
 *   get:
 *     summary: Get all workshops
 *     tags: [Workshop]
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
 *         description: Workshops retrieved successfully
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
router.get("/", WorkshopController.getAllWorkshops);

/**
 * @openapi
 * /workshop/{slug}:
 *   get:
 *     summary: Get single workshop by slug
 *     tags: [Workshop]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workshop retrieved successfully
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
router.get("/:slug", WorkshopController.getSingleWorkshop);

/**
 * @openapi
 * /workshop/create:
 *   post:
 *     summary: Create a new workshop
 *     tags: [Workshop]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - level
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               level:
 *                 type: string
 *               whatYouLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               syllabus:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxSeats:
 *                 type: number
 *               minAge:
 *                 type: number
 *               category:
 *                 type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Workshop created successfully
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
 *                   example: Workshop created successfully
 *                 data:
 *                   type: object
 */
router.post(
  "/create",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.array("files", 10),
  validateRequest(createWorkshopZodSchema),
  WorkshopController.createWorkshop,
);

/**
 * @openapi
 * /workshop/{id}:
 *   patch:
 *     summary: Update workshop by ID
 *     tags: [Workshop]
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
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *               startDate:
 *                 type: string
 *               endDate:
 *                 type: string
 *               level:
 *                 type: string
 *               whatYouLearn:
 *                 type: array
 *                 items:
 *                   type: string
 *               prerequisites:
 *                 type: array
 *                 items:
 *                   type: string
 *               benefits:
 *                 type: array
 *                 items:
 *                   type: string
 *               syllabus:
 *                 type: array
 *                 items:
 *                   type: string
 *               maxSeats:
 *                 type: number
 *               minAge:
 *                 type: number
 *               category:
 *                 type: string
 *               deleteImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Workshop updated successfully
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
 *                   example: Workshop updated successfully
 *                 data:
 *                   type: object
 */
router.patch(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.array("files"),
  validateRequest(updateWorkshopZodSchema),
  WorkshopController.updateWorkshop,
);

/**
 * @openapi
 * /workshop/{id}:
 *   delete:
 *     summary: Delete workshop by ID
 *     tags: [Workshop]
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
 *         description: Workshop deleted successfully
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
 *                   example: Workshop deleted successfully
 */
router.delete(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteWorkshop,
);

const WorkshopRoutes = router;

export default WorkshopRoutes;
