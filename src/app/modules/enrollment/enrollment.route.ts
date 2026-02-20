import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import validateRequest from "../../middlewares/validateRequest";
import {
  createEnrollmentZodSchema,
  updateEnrollmentStatusZodSchema,
} from "./enrollment.validation";
import EnrollmentController from "./enrollment.controller";

const router = express.Router();

router.post(
  "/",
  checkAuth(...Object.values(UserRole)),
  validateRequest(createEnrollmentZodSchema),
  EnrollmentController.createEnrollment,
);

router.get(
  "/",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  EnrollmentController.getAllEnrollments,
);

router.get(
  "/my-enrollments",
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getUserEnrollments,
);

router.get(
  "/:enrollmentId",
  checkAuth(...Object.values(UserRole)),
  EnrollmentController.getSingleEnrollment,
);

router.patch(
  "/:enrollmentId/status",
  checkAuth(...Object.values(UserRole)),
  validateRequest(updateEnrollmentStatusZodSchema),
  EnrollmentController.updateEnrollmentStatus,
);

const EnrollmentRoutes = router;

export default EnrollmentRoutes;
