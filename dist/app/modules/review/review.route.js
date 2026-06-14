import express from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { adminCrudLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import ReviewController from "./review.controller.js";
import { createReviewZodSchema, updateReviewZodSchema, } from "./review.validation.js";
const router = express.Router();
/**
 * @openapi
 * tags:
 *   name: Review
 *   description: Workshop review management
 */
// ── Public routes (no auth required) ──
/**
 * @openapi
 * /review/workshop/{workshopId}:
 *   get:
 *     summary: Get approved reviews for a workshop
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: workshopId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, highest, lowest]
 *           default: newest
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.get("/workshop/:workshopId", ReviewController.getWorkshopReviews);
/**
 * @openapi
 * /review/workshop/{workshopId}/stats:
 *   get:
 *     summary: Get review statistics for a workshop
 *     tags: [Review]
 *     parameters:
 *       - in: path
 *         name: workshopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review stats retrieved successfully
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.get("/workshop/:workshopId/stats", ReviewController.getWorkshopReviewStats);
// ── Protected routes (auth required) ──
/**
 * @openapi
 * /review:
 *   post:
 *     summary: Create a new review
 *     tags: [Review]
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
 *               - rating
 *               - title
 *               - content
 *             properties:
 *               workshop:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       409:
 *         $ref: "#/components/responses/ConflictError"
 */
router.post("/", adminCrudLimiter, checkAuth(...Object.values(UserRole)), validateRequest(createReviewZodSchema), ReviewController.createReview);
/**
 * @openapi
 * /review/workshop/{workshopId}/my-review:
 *   get:
 *     summary: Get the authenticated user's review for a workshop
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workshopId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User review retrieved successfully
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 */
router.get("/workshop/:workshopId/my-review", adminCrudLimiter, checkAuth(...Object.values(UserRole)), ReviewController.getUserReviewForWorkshop);
/**
 * @openapi
 * /review/{reviewId}:
 *   patch:
 *     summary: Update a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.patch("/:reviewId", adminCrudLimiter, checkAuth(...Object.values(UserRole)), validateRequest(updateReviewZodSchema), ReviewController.updateReview);
/**
 * @openapi
 * /review/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Review]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.delete("/:reviewId", adminCrudLimiter, checkAuth(...Object.values(UserRole)), ReviewController.deleteReview);
const ReviewRoutes = router;
export default ReviewRoutes;
