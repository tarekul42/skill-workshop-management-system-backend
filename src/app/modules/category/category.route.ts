import { Router } from "express";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import validateRequest from "../../middlewares/validateRequest";
import {
  createCategoryZodSchema,
  updateCategoryZodSchema,
} from "./category.validation";
import CategoryController from "./category.controller";

const router = Router();

router.post(
  "/create",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createCategoryZodSchema),
  CategoryController.createCategory,
);

router.get("/", CategoryController.getAllCategories);
router.get("/:slug", CategoryController.getSingleCategory);
router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(updateCategoryZodSchema),
  CategoryController.updateCategory,
);
router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  CategoryController.deleteCategory,
);

const categoryRoutes = router;

export default categoryRoutes;
