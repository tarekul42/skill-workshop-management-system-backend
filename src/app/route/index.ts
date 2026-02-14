import { Router } from "express";
import UserRoutes from "../modules/user/user.route";
import AuthRoutes from "../modules/auth/auth.route";
import categoryRoutes from "../modules/category/category.route";

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
    path: "/category",
    route: categoryRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
