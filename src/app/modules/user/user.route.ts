import { Router } from "express";
import UserControllers from "./user.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createUserZodSchema } from "./user.validation";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "./user.interface";
import { userListRateLimiter } from "../../utils/rateLimiter";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  UserControllers.createUser
);
router.get(
  "/all-users",
  userListRateLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserControllers.getAllUsers
);

const UserRoutes = router;

export default UserRoutes;
