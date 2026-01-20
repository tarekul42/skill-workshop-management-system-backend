import { Router } from "express";
import AuthControllers from "./auth.controller";
import { authLimiter } from "../../utils/rateLimiter";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";

const router = Router();

router.post("/login", authLimiter, AuthControllers.creadentialsLogin);
router.post("/refresh-token", authLimiter, AuthControllers.getNewAccessToken);
router.post("/logout", authLimiter, AuthControllers.logout);
router.post(
  "/reset-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  AuthControllers.resetPassword,
);

const AuthRoutes = router;

export default AuthRoutes;
