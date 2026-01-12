import { Router } from "express";
import UserControllers from "./user.controller";

const router = Router();

router.post("/register", UserControllers.createUser);

const UserRoutes = router;

export default UserRoutes;
