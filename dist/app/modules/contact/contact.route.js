import express from "express";
import checkAuth from "../../middlewares/checkAuth.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { adminCrudLimiter } from "../../utils/rateLimiter.js";
import { UserRole } from "../user/user.interface.js";
import ContactController from "./contact.controller.js";
import { createContactZodSchema } from "./contact.validation.js";
const router = express.Router();
/**
 * @openapi
 * tags:
 *   name: Contact
 *   description: Contact message management
 */
// ── Public: Submit a contact message ──
/**
 * @openapi
 * /contact:
 *   post:
 *     summary: Submit a contact message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         $ref: "#/components/responses/BadRequestError"
 */
router.post("/", adminCrudLimiter, validateRequest(createContactZodSchema), ContactController.createContact);
// ── Admin: Manage contact messages ──
/**
 * @openapi
 * /contact:
 *   get:
 *     summary: Get all contact messages (admin)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         name: isRead
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Contact messages retrieved successfully
 *       401:
 *         $ref: "#/components/responses/UnauthorizedError"
 *       403:
 *         $ref: "#/components/responses/ForbiddenError"
 */
router.get("/", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.getAllContacts);
/**
 * @openapi
 * /contact/{contactId}:
 *   get:
 *     summary: Get a contact message by ID (admin)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact message retrieved successfully
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.get("/:contactId", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.getContactById);
/**
 * @openapi
 * /contact/{contactId}/read:
 *   patch:
 *     summary: Mark a contact message as read (admin)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message marked as read
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.patch("/:contactId/read", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.markAsRead);
/**
 * @openapi
 * /contact/{contactId}:
 *   delete:
 *     summary: Delete a contact message (admin)
 *     tags: [Contact]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contactId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       404:
 *         $ref: "#/components/responses/NotFoundError"
 */
router.delete("/:contactId", checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN), ContactController.deleteContact);
const ContactRoutes = router;
export default ContactRoutes;
