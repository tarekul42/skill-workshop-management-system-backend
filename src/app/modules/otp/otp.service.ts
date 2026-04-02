import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import { mailQueue } from "../../jobs/mail.queue";
import User from "../user/user.model";

const OTP_EXPIRATION = 5 * 60;

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

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already verified");
  }

  const otp = generateOtp();

  const redisKey = `otp:${normalizedEmail}`;

  const hashedOtp = hashOtp(otp);

  await redisClient.set(redisKey, hashedOtp, {
    EX: OTP_EXPIRATION,
  });

  await mailQueue.add("otp", {
    type: "otp",
    payload: {
      email: normalizedEmail,
      name,
      otp,
    },
  });
};

const verifyOtp = async (email: string, otp: string) => {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findOne({ email: { $eq: normalizedEmail } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already verified");
  }

  const redisKey = `otp:${normalizedEmail}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(StatusCodes.NOT_FOUND, "OTP not found");
  }

  const attemptsKey = `otp_attempts:${normalizedEmail}`;
  const attempts = await redisClient.incr(attemptsKey);

  if (attempts === 1) {
    await redisClient.expire(attemptsKey, OTP_EXPIRATION);
  }

  if (attempts > 5) {
    await redisClient.del([redisKey, attemptsKey]);
    throw new AppError(
      StatusCodes.TOO_MANY_REQUESTS,
      "Too many failed attempts. Please request a new OTP.",
    );
  }

  if (savedOtp !== hashOtp(otp)) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
  }

  await Promise.all([
    User.updateOne(
      { email: { $eq: normalizedEmail } },
      { isVerified: true },
      { runValidators: true },
    ),
    redisClient.del([redisKey, attemptsKey]),
  ]);
};

const OTPService = {
  sendOtp,
  verifyOtp,
};

export default OTPService;
