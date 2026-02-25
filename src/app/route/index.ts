import { Router } from "express";
import AuthRoutes from "../modules/auth/auth.route";
import CategoryRoutes from "../modules/category/category.route";
import EnrollmentRoutes from "../modules/enrollment/enrollment.route";
import PaymentRoutes from "../modules/payment/payment.route";
import UserRoutes from "../modules/user/user.route";
import WorkshopRoutes from "../modules/workshop/workshop.routes";

const router = Router();

const moduleRoutes = [
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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
