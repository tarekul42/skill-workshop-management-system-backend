import express from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { adminCrudLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import EnrollmentController from "./enrollment.controller.js";
import {
  createEnrollmentZodSchema,
  updateEnrollmentStatusZodSchema,
} from "./enrollment.validation.js";

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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Enrollment" }
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Enrollment" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: "#/components/schemas/Enrollment" }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Enrollment" }
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data: { $ref: "#/components/schemas/Enrollment" }
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
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
router.patch(
  "/:enrollmentId/status",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateEnrollmentStatusZodSchema),
  EnrollmentController.updateEnrollmentStatus,
);

/**
 * @openapi
 * /enrollment/{enrollmentId}:
 *   delete:
 *     summary: Cancel an enrollment
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
 *         description: Enrollment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/BaseResponse"
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
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
router.delete(
  "/:enrollmentId",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.cancelEnrollment,
);

const EnrollmentRoutes = router;

export default EnrollmentRoutes;
