"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const enrollment_controller_1 = __importDefault(require("./enrollment.controller"));
const enrollment_validation_1 = require("./enrollment.validation");
const router = express_1.default.Router();
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
 */
router.post("/", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), (0, validateRequest_1.default)(enrollment_validation_1.createEnrollmentZodSchema), enrollment_controller_1.default.createEnrollment);
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
 */
router.get("/", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), enrollment_controller_1.default.getAllEnrollments);
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
 */
router.get("/my-enrollments", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), enrollment_controller_1.default.getUserEnrollments);
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
 */
router.get("/:enrollmentId", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), enrollment_controller_1.default.getSingleEnrollment);
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
 */
router.patch("/:enrollmentId/status", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), (0, validateRequest_1.default)(enrollment_validation_1.updateEnrollmentStatusZodSchema), enrollment_controller_1.default.updateEnrollmentStatus);
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
 */
router.delete("/:enrollmentId", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), enrollment_controller_1.default.cancelEnrollment);
const EnrollmentRoutes = router;
exports.default = EnrollmentRoutes;
