import { Router } from "express";
import UserControllers from "./user.controller";

const router = Router();

router.post("/register", UserControllers.createUser);
router.get("/all-users", UserControllers.getAllUsers);

const UserRoutes = router;

export default UserRoutes;
