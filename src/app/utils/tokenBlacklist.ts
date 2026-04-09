import crypto from "crypto";
import { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../config/redis.config";
import { verifyToken } from "./jwt";

/**
 * Generates a hash for the token to be used as a key in Redis.
 * @param token - The token string.
 * @returns The hex hash of the token.
 */
const getTokenHash = (token: string) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

/**
 * Invalidates a token by adding its hash to a blacklist in Redis.
 * The entry in Redis will expire when the token itself would have expired.
 * 
 * @param token - The token string to invalidate.
 * @param secret - The secret used to verify the token (to get its expiry).
 */
export const invalidateToken = async (token: string, secret: string) => {
  try {
    const decoded = verifyToken(token, secret) as JwtPayload;
    if (!decoded.exp) return;

    const tokenHash = getTokenHash(token);
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await redisClient.set(`blacklist:${tokenHash}`, "true", {
        EX: ttl,
      });
    }
  } catch (error) {
    // If token is already invalid/expired, we don't need to do anything
    return;
  }
};

/**
 * Checks if a token is blacklisted.
 * 
 * @param token - The token string to check.
 * @returns True if blacklisted, false otherwise.
 */
export const isTokenBlacklisted = async (token: string) => {
  const tokenHash = getTokenHash(token);
  const result = await redisClient.get(`blacklist:${tokenHash}`);
  return !!result;
};
