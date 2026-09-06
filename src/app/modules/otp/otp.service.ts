import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { redisClient } from "../../config/redis.config.js";
import AppError from "../../errorHelpers/AppError.js";
import logger from "../../utils/logger.js";
import { sendEmailDirect } from "../../utils/sendEmailDirect.js";
import User from "../user/user.model.js";

// 5 minutes — extended for user convenience; brute-force risk mitigated by 5-attempt limit
const OTP_EXPIRATION = 5 * 60;
// Minimum 60 seconds between OTP resends to the same email (prevents email spam/DoS)
const OTP_RESEND_COOLDOWN = 60;

const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();

  return otp;
};

const hashOtp = (otp: string) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

const sendOtp = async (email: string, name: string) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: { $eq: normalizedEmail } });

  // Generic success message to prevent user enumeration
  if (!user || user.isVerified) {
    return;
  }

  // Per-email cooldown: prevent spamming OTPs to the same address
  const cooldownKey = `otp_sent:${normalizedEmail}`;
  const ttl = await redisClient.ttl(cooldownKey);
  if (ttl > 0) {
    // Still in cooldown — silently return (same generic "sent" response)
    return;
  }

  const otp = generateOtp();

  const redisKey = `otp:${normalizedEmail}`;

  const hashedOtp = hashOtp(otp);

  await redisClient.set(redisKey, hashedOtp, {
    EX: OTP_EXPIRATION,
  });

  // Set per-email cooldown to prevent rapid resends
  await redisClient.set(cooldownKey, "1", { EX: OTP_RESEND_COOLDOWN });

  await sendEmailDirect({
    to: normalizedEmail,
    subject: "OTP Verification",
    templateName: "otp",
    templateData: {
      name,
      otp,
    },
  });
};

const verifyOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: { $eq: normalizedEmail } });

  // Single generic error for all failure modes (prevents user enumeration)
  const GENERIC_ERROR = "Invalid or expired OTP";

  if (!user || user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, GENERIC_ERROR);
  }

  const redisKey = `otp:${normalizedEmail}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(StatusCodes.BAD_REQUEST, GENERIC_ERROR);
  }

  // Compare the OTP hash FIRST, before incrementing the attempt counter.
  // This prevents a correct OTP from being rejected because a concurrent
  // wrong guess incremented the counter first.
  if (savedOtp !== hashOtp(otp)) {
    const attemptsKey = `otp_attempts:${normalizedEmail}`;

    // Increment attempt counter atomically — serialises concurrent wrong guesses
    const attemptCount = await redisClient.incr(attemptsKey);
    if (attemptCount === 1) {
      await redisClient.expire(attemptsKey, OTP_EXPIRATION);
    }

    if (attemptCount > 5) {
      await redisClient.del([redisKey, attemptsKey]);
      throw new AppError(
        StatusCodes.TOO_MANY_REQUESTS,
        "Too many failed attempts. Please request a new OTP.",
      );
    }

    throw new AppError(StatusCodes.BAD_REQUEST, GENERIC_ERROR);
  }

  // OTP is correct — clean up Redis FIRST, then mark user as verified.
  // Order matters: if the app crashes between the two calls the worst case is
  // a harmless false negative (OTP consumed, user needs to request a new one).
  // The reverse order (MongoDB first) would risk a false positive where the
  // user is verified but the OTP remains usable.
  await redisClient.del([redisKey, `otp_attempts:${normalizedEmail}`]);

  await User.updateOne(
    { email: { $eq: normalizedEmail } },
    { isVerified: true },
    { runValidators: true },
  );

  // ── Send welcome email ──
  if (user) {
    try {
      await sendEmailDirect({
        to: normalizedEmail,
        subject: "Welcome to Skill Workshop!",
        templateName: "welcome",
        templateData: {
          name: user.name,
          role: user.role,
          dashboardLink: `${process.env.FRONTEND_URL || ""}/login`,
        },
      });
    } catch (emailErr) {
      logger.error({
        msg: "Welcome email failed after successful OTP verification",
        email: normalizedEmail,
        err: emailErr,
      });
    }
  }
};

const OTPService = {
  sendOtp,
  verifyOtp,
};

export default OTPService;
