import { NextFunction, Request, Response, Router } from "express";
import passport from "passport";
import checkAuth from "../../middlewares/checkAuth";
import { authLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import AuthControllers from "./auth.controller";
import envVariables from "../../config/env";

const router = Router();

router.post("/login", authLimiter, AuthControllers.credentialsLogin);
router.post("/refresh-token", authLimiter, AuthControllers.getNewAccessToken);
router.post("/logout", authLimiter, AuthControllers.logout);
router.post(
  "/change-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  AuthControllers.changePassword,
);
router.post(
  "/set-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  AuthControllers.setPassword,
);
router.post("/forgot-password", authLimiter, AuthControllers.forgotPassword);
router.post(
  "/reset-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  AuthControllers.resetPassword,
);

router.get(
  "/google",
  authLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    const redirect = req.query.redirect || "/";
    passport.authenticate("google", {
      scope: ["profile", "email"],
      state: redirect as string,
    })(req, res, next);
  },
);

router.get(
  "/google/callback",
  authLimiter,
  passport.authenticate("google", {
    failureRedirect: `${envVariables.FRONTEND_URL}/login?error=${encodeURIComponent("There are some issues with your account. Please contact our support team.")}`,
  }),
  AuthControllers.googleCallback,
);

const AuthRoutes = router;

export default AuthRoutes;
