import { NextFunction, Request, Response, Router } from "express";
import AuthControllers from "./auth.controller";
import { authLimiter } from "../../utils/rateLimiter";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import passport from "passport";

const router = Router();

router.post("/login", authLimiter, AuthControllers.credentialsLogin);
router.post("/refresh-token", authLimiter, AuthControllers.getNewAccessToken);
router.post("/logout", authLimiter, AuthControllers.logout);
router.post(
  "/reset-password",
  authLimiter,
  checkAuth(...Object.values(UserRole)),
  AuthControllers.resetPassword,
);

router.get(
  "/google",
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
  passport.authenticate("google", { failureRedirect: "/login" }),
  AuthControllers.googleCallback,
);

const AuthRoutes = router;

export default AuthRoutes;
