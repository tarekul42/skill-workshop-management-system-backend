import express from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import { adminCrudLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import AuditController from "./audit.controller.js";
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id: { type: string }
 *                           collectionName: { type: string }
 *                           documentId: { type: string }
 *                           action: { type: string, enum: [CREATE, UPDATE, DELETE] }
 *                           performedBy: { type: string }
 *                           changes: { type: object }
 *                           createdAt: { type: string, format: date-time }
 *                     meta:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       429:
 *         $ref: "#/components/responses/TooManyRequestsError"
 *       500:
 *         $ref: "#/components/responses/InternalServerError"
 */
router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), AuditController.getAuditLogs);
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
 *               allOf:
 *                 - $ref: "#/components/schemas/BaseResponse"
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id: { type: string }
 *                         collectionName: { type: string }
 *                         documentId: { type: string }
 *                         action: { type: string, enum: [CREATE, UPDATE, DELETE] }
 *                         performedBy: { type: string }
 *                         changes: { type: object }
 *                         createdAt: { type: string, format: date-time }
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
router.get("/:id", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), AuditController.getAuditLogById);
export const AuditRoutes = router;
