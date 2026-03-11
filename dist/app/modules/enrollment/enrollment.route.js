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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
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
router.patch("/:enrollmentId/status", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(...Object.values(user_interface_1.UserRole)), (0, validateRequest_1.default)(enrollment_validation_1.updateEnrollmentStatusZodSchema), enrollment_controller_1.default.updateEnrollmentStatus);
const EnrollmentRoutes = router;
exports.default = EnrollmentRoutes;
