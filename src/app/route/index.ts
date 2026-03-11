import { Router } from "express";
import AuthRoutes from "../modules/auth/auth.route";
import CategoryRoutes from "../modules/category/category.route";
import EnrollmentRoutes from "../modules/enrollment/enrollment.route";
import OTPRoutes from "../modules/otp/otp.route";
import PaymentRoutes from "../modules/payment/payment.route";
import StatsRoutes from "../modules/stats/stats.route";
import UserRoutes from "../modules/user/user.route";
import WorkshopRoutes from "../modules/workshop/workshop.route";
import { HealthRoutes } from "../modules/health/health.route";

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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
