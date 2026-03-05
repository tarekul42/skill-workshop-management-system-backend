import express from "express";
import OTPController from "./otp.controller";
import { strictLimiter } from "../../utils/rateLimiter";

const router = express.Router();

router.post("/send", OTPController.sendOtp);
router.post("/verify", strictLimiter, OTPController.verifyOtp);

const OTPRoutes = router;

export default OTPRoutes;
