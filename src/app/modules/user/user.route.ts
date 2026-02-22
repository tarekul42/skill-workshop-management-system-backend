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

router.patch(
  "/:id",
  strictLimiter,
  validateRequest(updateUserZodSchema),
  checkAuth(...Object.values(UserRole)),
  UserControllers.updateUser,
);

router.get(
  "/all-users",
  strictLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  UserControllers.getAllUsers,
);

const UserRoutes = router;

export default UserRoutes;
