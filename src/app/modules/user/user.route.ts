import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { strictLimiter } from "../../utils/rateLimiter";
import UserControllers from "./user.controller";
import { UserRole } from "./user.interface";
import { createUserZodSchema, updateUserZodSchema } from "./user.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(createUserZodSchema),
  UserControllers.createUser,
);

router.get(
  "/:id",
  strictLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserControllers.getSingleUser,
);

router.get(
  "/me",
  strictLimiter,
  checkAuth(...Object.values(UserRole)),
  UserControllers.getMe,
);

router.get(
  "/all-users",
  strictLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserControllers.getAllUsers,
);

router.patch(
  "/:id",
  strictLimiter,
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(UserRole)),
  UserControllers.updateUser,
);

const UserRoutes = router;

export default UserRoutes;
