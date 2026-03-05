import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import StatsController from "./stats.controller";
import { adminCrudLimiter } from "../../utils/rateLimiter";

const router = express.Router();

router.get(
  "/enrollment",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getEnrollmentStatus,
);

router.get(
  "/payment",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getPaymentStatus,
);

router.get(
  "/users",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getUserStats,
);

router.get(
  "/workshops",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  adminCrudLimiter,
  StatsController.getWorkshopStats,
);

const StatsRoutes = router;

export default StatsRoutes;
