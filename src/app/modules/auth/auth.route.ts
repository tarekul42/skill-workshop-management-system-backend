import { Router } from "express";
import AuthControllers from "./auth.controller";
import { authLimiter } from "../../utils/rateLimiter";

const router = Router();

router.post("/login", authLimiter, AuthControllers.creadentialsLogin);
router.post("/refresh-token", authLimiter, AuthControllers.getNewAccessToken);
router.post("/logout", authLimiter, AuthControllers.logout);

const AuthRoutes = router;

export default AuthRoutes;
