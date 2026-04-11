import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { adminCrudLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import StatsController from "./stats.controller";

const router = express.Router();

/**
 * @openapi
 * tags:
 *   name: Stats
 *   description: Admin statistics and analytics
 */

/**
 * @openapi
 * /stats/enrollment:
 *   get:
 *     summary: Get enrollment statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Enrollment stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalEnrollment:
 *                           type: integer
 *                         totalEnrollmentByStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 enum: [PENDING, CANCEL, COMPLETE, FAILED]
 *                               count:
 *                                 type: integer
 *                         enrollmentsPerWorkshop:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               enrollmentCount:
 *                                 type: integer
 *                               workshop:
 *                                 type: object
 *                                 properties:
 *                                   title:
 *                                     type: string
 *                                   slug:
 *                                     type: string
 *                         avgGuestCountPerEnrollment:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 nullable: true
 *                               avgStudentCount:
 *                                 type: number
 *                         enrollmentsLastSevenDays:
 *                           type: integer
 *                         enrollmentsLastThirtyDays:
 *                           type: integer
 *                         totalEnrollmentByUniqueUsers:
 *                           type: integer
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
  "/enrollment",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getEnrollmentStatus,
);

/**
 * @openapi
 * /stats/payment:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalPayment:
 *                           type: integer
 *                         totalPaymentByStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 enum: [PAID, UNPAID, CANCELLED, FAILED, REFUNDED]
 *                               count:
 *                                 type: integer
 *                         totalRevenue:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 nullable: true
 *                               totalRevenue:
 *                                 type: number
 *                         avgPaymentAmount:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 nullable: true
 *                               avgPaymentAmount:
 *                                 type: number
 *                         paymentGatewayData:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               count:
 *                                 type: integer
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
  "/payment",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getPaymentStatus,
);

/**
 * @openapi
 * /stats/users:
 *   get:
 *     summary: Get user statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: integer
 *                         totalActiveUsers:
 *                           type: integer
 *                         totalInActiveUsers:
 *                           type: integer
 *                         totalBlockedUsers:
 *                           type: integer
 *                         newUsersInLastSevenDays:
 *                           type: integer
 *                         newUsersInLastThirtyDays:
 *                           type: integer
 *                         usersByRole:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 enum: [SUPER_ADMIN, ADMIN, INSTRUCTOR, STUDENT]
 *                               count:
 *                                 type: integer
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
  "/users",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getUserStats,
);

/**
 * @openapi
 * /stats/workshops:
 *   get:
 *     summary: Get workshop statistics
 *     tags: [Stats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Workshop stats retrieved
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     avgWorkshopPrice:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             nullable: true
 *                           avgPrice:
 *                             type: number
 *                     totalWorkshopByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     totalHighestEnrolledWorkshop:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           enrollmentCount:
 *                             type: integer
 *                           workshop:
 *                             type: object
 *                             properties:
 *                               title:
 *                                 type: string
 *                               slug:
 *                                 type: string
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
  "/workshops",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getWorkshopStats,
);

const StatsRoutes = router;

export default StatsRoutes;
