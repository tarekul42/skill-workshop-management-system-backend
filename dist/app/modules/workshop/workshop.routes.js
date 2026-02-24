"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const checkAuth_1 = __importDefault(require("../../middlewares/checkAuth"));
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const rateLimiter_1 = require("../../utils/rateLimiter");
const user_interface_1 = require("../user/user.interface");
const workshop_controller_1 = __importDefault(require("./workshop.controller"));
const workshop_validation_1 = require("./workshop.validation");
const multer_config_1 = __importDefault(require("../../config/multer.config"));
const router = express_1.default.Router();
// levels routes
router.get("/levels", workshop_controller_1.default.getAllLevels);
router.get("/levels/:id", workshop_controller_1.default.getSingleLevel);
router.post("/create-level", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(workshop_validation_1.createLevelZodSchema), workshop_controller_1.default.createLevel);
router.patch("/levels/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), (0, validateRequest_1.default)(workshop_validation_1.createLevelZodSchema), workshop_controller_1.default.updateLevel);
router.delete("/levels/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), workshop_controller_1.default.deleteLevel);
// workshop routes
router.get("/", workshop_controller_1.default.getAllWorkshops);
router.get("/:slug", workshop_controller_1.default.getSingleWorkshop);
router.post("/create", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), multer_config_1.default.array("files"), (0, validateRequest_1.default)(workshop_validation_1.createWorkshopZodSchema), workshop_controller_1.default.createWorkshop);
router.patch("/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), multer_config_1.default.array("files"), (0, validateRequest_1.default)(workshop_validation_1.updateWorkshopZodSchema), workshop_controller_1.default.updateWorkshop);
router.delete("/:id", rateLimiter_1.adminCrudLimiter, (0, checkAuth_1.default)(user_interface_1.UserRole.ADMIN, user_interface_1.UserRole.SUPER_ADMIN), workshop_controller_1.default.deleteWorkshop);
