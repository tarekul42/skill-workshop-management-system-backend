import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import { redisClient } from "../../config/redis.config";
import AppError from "../../errorHelpers/AppError";
import sendEmail from "../../utils/sendEmail";
import User from "../user/user.model";

const OTP_EXPIRATION = 2 * 60;

const generateOtp = (length = 6) => {
  const otp = crypto.randomInt(10 ** (length - 1), 10 ** length).toString();

  return otp;
};

const sendOtp = async (email: string, name: string) => {
  const user = await User.findOne({ email: { $eq: email } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }
  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already verified");
  }

  const otp = generateOtp();

  const redisKey = `otp:${email}`;

  await redisClient.set(redisKey, otp, {
    expiration: {
      type: "EX",
      value: OTP_EXPIRATION,
    },
  });

  await sendEmail({
    to: email,
    subject: "OTP Verification",
    templateName: "otp",
    templateData: {
      name,
      otp,
    },
  });
};

const verifyOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email: { $eq: email } });

  if (!user) {
    throw new AppError(StatusCodes.NOT_FOUND, "User not found");
  }

  if (user.isVerified) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User already verified");
  }

  const redisKey = `otp:${email}`;

  const savedOtp = await redisClient.get(redisKey);

  if (!savedOtp) {
    throw new AppError(StatusCodes.NOT_FOUND, "OTP not found");
  }

  const attemptsKey = `otp_attempts:${email}`;
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

  if (savedOtp !== otp) {
    throw new AppError(StatusCodes.UNAUTHORIZED, "Invalid OTP");
  }

  await Promise.all([
    User.updateOne(
      { email: { $eq: email } },
      { isVerified: true },
      { runValidators: true },
    ),
    redisClient.del([redisKey]),
  ]);
};

const OTPService = {
  sendOtp,
  verifyOtp,
};

export default OTPService;
