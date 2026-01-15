import { Router } from "express";
import AuthControllers from "./auth.controller";
import { loginRateLimiter } from "../../utils/rateLimiter";

const router = Router();

router.post("/login", loginRateLimiter, AuthControllers.creadentialsLogin);

const AuthRoutes = router;

export default AuthRoutes;
