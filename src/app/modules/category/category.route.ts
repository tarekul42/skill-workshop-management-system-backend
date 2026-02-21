import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import validateRequest from "../../middlewares/validateRequest";
import {
  createCategoryZodSchema,
  updateCategoryZodSchema,
} from "./category.validation";
import CategoryController from "./category.controller";
import { adminCrudLimiter } from "../../utils/rateLimiter";

const router = Router();

router.post(
  "/create",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createCategoryZodSchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getAllCategories);
router.get("/:slug", CategoryController.getSingleCategory);
router.patch(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateCategoryZodSchema),
  CategoryController.updateCategory,
);
router.delete(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.deleteCategory,
);

const CategoryRoutes = router;

export default CategoryRoutes;
