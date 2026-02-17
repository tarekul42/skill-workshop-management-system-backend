import express from "express";
import WorkshopController from "./workshop.controller";
import checkAuth from "../../middlewares/checkAuth";
import { UserRole } from "../user/user.interface";
import validateRequest from "../../middlewares/validateRequest";
import {
  createLevelZodSchema,
  createWorkshopZodSchema,
} from "./workshop.validation";

const router = express.Router();

// levels routes
router.get("/levels", WorkshopController.getAllLevels);

router.post(
  "/create-level",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.createLevel,
);

router.patch(
  "/levels/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createLevelZodSchema),
  WorkshopController.updateLevel,
);

router.delete(
  "/levels/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteLevel,
);

// workshop routes
router.get("/", WorkshopController.getAllWorkshops);

router.post(
  "/create",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createWorkshopZodSchema),
  WorkshopController.createWorkshop,
);

router.patch(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateRequest(createWorkshopZodSchema),
  WorkshopController.updateWorkshop,
);

router.delete(
  "/:id",
  checkAuth(UserRole.ADMIN, UserRole.SUPER_ADMIN),
  WorkshopController.deleteWorkshop,
);
