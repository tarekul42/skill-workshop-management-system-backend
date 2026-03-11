import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import StatsController from "./stats.controller";
import { adminCrudLimiter } from "../../utils/rateLimiter";

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
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
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
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
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
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
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
 *               $ref: "#/components/schemas/BaseResponse"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get(
  "/workshops",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getWorkshopStats,
);

const StatsRoutes = router;

export default StatsRoutes;
