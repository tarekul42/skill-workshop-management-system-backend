import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { adminCrudLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import AuditController from "./audit.controller";

const router = express.Router();

router.use(adminCrudLimiter);

/**
 * @openapi
 * tags:
 *   name: Audit
 *   description: Audit trail endpoints (admin only)
 */

/**
 * @openapi
 * /audit/:
 *   get:
 *     summary: List audit logs
 *     description: >
 *       Retrieve paginated audit logs with optional filters.
 *       Requires ADMIN or SUPER_ADMIN role.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number (default 1)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page (default 20)
 *       - in: query
 *         name: collectionName
 *         schema:
 *           type: string
 *         description: Filter by collection (e.g. "Payment", "User")
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [CREATE, UPDATE, DELETE]
 *         description: Filter by action type
 *       - in: query
 *         name: performedBy
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: documentId
 *         schema:
 *           type: string
 *         description: Filter by document ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start of date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End of date range
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       action:
 *                         type: string
 *                         enum: [CREATE, UPDATE, DELETE]
 *                       collectionName:
 *                         type: string
 *                       documentId:
 *                         type: string
 *                       performedBy:
 *                         type: string
 *                         nullable: true
 *                       changes:
 *                         type: object
 *                         description: Key-value pairs of field changes
 *                       ipAddress:
 *                         type: string
 *                         nullable: true
 *                       userAgent:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get(
  "/",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AuditController.getAuditLogs,
);

/**
 * @openapi
 * /audit/{id}:
 *   get:
 *     summary: Get a single audit log
 *     description: Retrieve a specific audit log entry by ID. Requires ADMIN or SUPER_ADMIN role.
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     action:
 *                       type: string
 *                       enum: [CREATE, UPDATE, DELETE]
 *                     collectionName:
 *                       type: string
 *                     documentId:
 *                       type: string
 *                     performedBy:
 *                       type: string
 *                       nullable: true
 *                     changes:
 *                       type: object
 *                     ipAddress:
 *                       type: string
 *                       nullable: true
 *                     userAgent:
 *                       type: string
 *                       nullable: true
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       404:
 *         description: Audit log not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ErrorResponse"
 */
router.get(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  AuditController.getAuditLogById,
);

export const AuditRoutes = router;
