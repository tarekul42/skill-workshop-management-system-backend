import crypto from "crypto";
import { StatusCodes } from "http-status-codes";
import envVariables from "../config/env.js";
import { redisClient } from "../config/redis.config.js";
import AppError from "../errorHelpers/AppError.js";
import { IsActive, IUser } from "../modules/user/user.interface.js";
import User from "../modules/user/user.model.js";
import { generateToken, verifyToken } from "./jwt.js";
import logger from "./logger.js";
import { parseExpiryToSeconds } from "./parseExpiry.js";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

// Each login creates its own session (identified by jti), so multiple
// devices can hold independent refresh tokens simultaneously.
const refreshSessionKey = (userId: string, jti: string) =>
  `refresh_token:${userId}:${jti}`;

const REFRESH_KEY_SCAN_PREFIX = "refresh_token:";

/** Revoke every active refresh session for a user (all devices). */
const revokeAllRefreshTokens = async (userId: string): Promise<void> => {
  const pattern = `${REFRESH_KEY_SCAN_PREFIX}${userId}:*`;
  const keys: string[] = [];
  for await (const key of redisClient.scanIterator({
    MATCH: pattern,
    COUNT: 100,
  })) {
    keys.push(String(key));
  }
  if (keys.length > 0) {
    for (const k of keys) await redisClient.del(k);
    logger.warn({
      msg: "All refresh sessions revoked for user",
      userId,
      revokedSessions: keys.length,
    });
  }
};

/**
 * Revoke a single refresh session by presenting the refresh token itself.
 * Used at logout so other devices stay logged in.
 */
const revokeRefreshSession = async (
  refreshToken: string,
): Promise<boolean> => {
  try {
    const payload = verifyToken(refreshToken, envVariables.JWT_REFRESH_SECRET);
    if (!payload.userId || !payload.jti) return false;
    await redisClient.del(
      refreshSessionKey(payload.userId as string, payload.jti as string),
    );
    return true;
  } catch {
    return false;
  }
};

const createUserTokens = async (user: Partial<IUser>) => {
  const jti = crypto.randomUUID();
  const jwtPayload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    jti,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVariables.JWT_ACCESS_SECRET,
    envVariables.JWT_ACCESS_EXPIRES,
  );

  const refreshToken = generateToken(
    jwtPayload,
    envVariables.JWT_REFRESH_SECRET,
    envVariables.JWT_REFRESH_EXPIRES,
  );

  const hashedToken = hashToken(refreshToken);
  await redisClient.set(refreshSessionKey(String(user._id), jti), hashedToken, {
    EX: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES),
  });

  return { accessToken, refreshToken };
};

const createNewAccessToken = async (refreshToken: string) => {
  const verifiedPayload = verifyToken(
    refreshToken,
    envVariables.JWT_REFRESH_SECRET,
  );

  const userId = verifiedPayload.userId as string;
  const jti = verifiedPayload.jti as string | undefined;

  if (!jti) {
    // Pre-multi-session token without a jti — force re-login.
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  let storedHashedToken: string | null;
  try {
    storedHashedToken = await redisClient.get(refreshSessionKey(userId, jti));
  } catch (error) {
    logger.error({
      msg: "Redis unavailable — cannot verify refresh token",
      err: error,
    });
    throw new AppError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      "Authentication service temporarily unavailable",
    );
  }

  if (!storedHashedToken || storedHashedToken !== hashToken(refreshToken)) {
    // REUSE DETECTION: this token was already rotated/revoked (or forged).
    // Treat as theft and revoke every session belonging to this user.
    logger.warn({
      msg:
        "Refresh token reuse detected — revoking ALL sessions for this user",
      userId,
      jti,
    });
    try {
      await revokeAllRefreshTokens(userId);
    } catch (error) {
      logger.error({ msg: "Failed to revoke sessions after reuse", error });
    }
    throw new AppError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  const isUserExists = await User.findById(verifiedPayload.userId);

  if (!isUserExists) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User does not exist");
  }

  if (
    isUserExists.isActive === IsActive.INACTIVE ||
    isUserExists.isActive === IsActive.BLOCKED
  ) {
    throw new AppError(
      StatusCodes.FORBIDDEN,
      `User is ${isUserExists.isActive.toLowerCase()}.`,
    );
  }

  if (isUserExists.isDeleted) {
    throw new AppError(StatusCodes.BAD_REQUEST, "User is deleted");
  }

  const newJti = crypto.randomUUID();
  const jwtPayload = {
    userId: isUserExists._id,
    email: isUserExists.email,
    role: isUserExists.role,
    jti: newJti,
  };

  const accessToken = generateToken(
    jwtPayload,
    envVariables.JWT_ACCESS_SECRET,
    envVariables.JWT_ACCESS_EXPIRES,
  );

  const newRefreshToken = generateToken(
    jwtPayload,
    envVariables.JWT_REFRESH_SECRET,
    envVariables.JWT_REFRESH_EXPIRES,
  );

  // Rotate: persist the new generation first, then remove the old one.
  // If Redis fails mid-rotation we fail closed — the old token remains valid
  // and the client can retry rather than being stranded.
  const hashedNewToken = hashToken(newRefreshToken);
  await redisClient.set(
    refreshSessionKey(userId, newJti),
    hashedNewToken,
    {
      EX: parseExpiryToSeconds(envVariables.JWT_REFRESH_EXPIRES),
    },
  );
  await redisClient.del(refreshSessionKey(userId, jti));

  return { accessToken, refreshToken: newRefreshToken };
};

export {
  createNewAccessToken,
  createUserTokens,
  revokeAllRefreshTokens,
  revokeRefreshSession,
};
