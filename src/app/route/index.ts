import { Router } from "express";
import { AuditRoutes } from "../modules/audit/audit.route.js";
import AuthRoutes from "../modules/auth/auth.route.js";
import CategoryRoutes from "../modules/category/category.route.js";
import EnrollmentRoutes from "../modules/enrollment/enrollment.route.js";
import { HealthRoutes } from "../modules/health/health.route.js";
import OTPRoutes from "../modules/otp/otp.route.js";
import PaymentRoutes from "../modules/payment/payment.route.js";
import StatsRoutes from "../modules/stats/stats.route.js";
import UserRoutes from "../modules/user/user.route.js";
import WorkshopRoutes from "../modules/workshop/workshop.route.js";

const router = Router();

const moduleRoutes = [
  {
    path: "/health",
    route: HealthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/workshop",
    route: WorkshopRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
  {
    path: "/enrollment",
    route: EnrollmentRoutes,
  },
  {
    path: "/payment",
    route: PaymentRoutes,
  },
  {
    path: "/otp",
    route: OTPRoutes,
  },
  {
    path: "/stats",
    route: StatsRoutes,
  },
  {
    path: "/audit",
    route: AuditRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
