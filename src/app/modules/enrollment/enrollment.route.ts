import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { adminCrudLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import EnrollmentController from "./enrollment.controller";
import {
  createEnrollmentZodSchema,
  updateEnrollmentStatusZodSchema,
} from "./enrollment.validation";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Enrollment
 *   description: Enrollment management
 */

/**
 * @openapi
 * /enrollment:
 *   post:
 *     summary: Create a new enrollment
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - workshop
 *               - studentCount
 *             properties:
 *               workshop:
 *                 type: string
 *                 description: Workshop ID
 *               studentCount:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Enrollment created successfully
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
 *                   example: Enrollment created successfully
 *                 data:
 *                   type: object
 */
router.post(
  "/",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(createEnrollmentZodSchema),
  EnrollmentController.createEnrollment,
);

/**
 * @openapi
 * /enrollment:
 *   get:
 *     summary: Get all enrollments
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollments retrieved successfully
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
router.get(
  "/",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  EnrollmentController.getAllEnrollments,
);

/**
 * @openapi
 * /enrollment/my-enrollments:
 *   get:
 *     summary: Get my enrollments
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My enrollments retrieved successfully
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
router.get(
  "/my-enrollments",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getUserEnrollments,
);

/**
 * @openapi
 * /enrollment/{enrollmentId}:
 *   get:
 *     summary: Get single enrollment by ID
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment retrieved successfully
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
router.get(
  "/:enrollmentId",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getSingleEnrollment,
);

/**
 * @openapi
 * /enrollment/{enrollmentId}/status:
 *   patch:
 *     summary: Update enrollment status
 *     tags: [Enrollment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CANCEL, COMPLETE, FAILED]
 *     responses:
 *       200:
 *         description: Enrollment status updated successfully
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
 *                   example: Enrollment status updated successfully
 *                 data:
 *                   type: object
 */
router.patch(
  "/:enrollmentId/status",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateEnrollmentStatusZodSchema),
  EnrollmentController.updateEnrollmentStatus,
);

const EnrollmentRoutes = router;

export default EnrollmentRoutes;
