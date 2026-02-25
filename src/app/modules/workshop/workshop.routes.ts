import express from "express";
import checkAuth from "../../middlewares/checkAuth";
import validateRequest from "../../middlewares/validateRequest";
import { adminCrudLimiter } from "../../utils/rateLimiter";
import { UserRole } from "../user/user.interface";
import WorkshopController from "./workshop.controller";
import {
  createLevelZodSchema,
  createWorkshopZodSchema,
  updateWorkshopZodSchema,
} from "./workshop.validation";
import multerUpload from "../../config/multer.config";

const router = express.Router();

// levels routes
router.get("/levels", WorkshopController.getAllLevels);

router.get("/levels/:id", WorkshopController.getSingleLevel);

router.post(
  "/create-level",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.createLevel,
);

router.patch(
  "/levels/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.updateLevel,
);

router.delete(
  "/levels/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteLevel,
);

// workshop routes
router.get("/", WorkshopController.getAllWorkshops);

router.get("/:slug", WorkshopController.getSingleWorkshop);

router.post(
  "/create",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.array("files"),
  validateRequest(createWorkshopZodSchema),
  WorkshopController.createWorkshop,
);

router.patch(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  multerUpload.array("files"),
  validateRequest(updateWorkshopZodSchema),
  WorkshopController.updateWorkshop,
);

router.delete(
  "/:id",
  adminCrudLimiter,
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteWorkshop,
);

const WorkshopRoutes = router;

export default WorkshopRoutes;
