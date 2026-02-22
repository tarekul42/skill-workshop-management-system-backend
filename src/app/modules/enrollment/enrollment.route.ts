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

router.post(
  "/",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(createEnrollmentZodSchema),
  EnrollmentController.createEnrollment,
);

router.get(
  "/",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  EnrollmentController.getAllEnrollments,
);

router.get(
  "/my-enrollments",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getUserEnrollments,
);

router.get(
  "/:enrollmentId",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getSingleEnrollment,
);

router.patch(
  "/:enrollmentId/status",
  adminCrudLimiter,
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateEnrollmentStatusZodSchema),
  EnrollmentController.updateEnrollmentStatus,
);

const EnrollmentRoutes = router;

export default EnrollmentRoutes;
