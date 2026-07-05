import crypto from "crypto";
import { JwtPayload } from "jsonwebtoken";
import { redisClient } from "../config/redis.config.js";
import { verifyToken } from "./jwt.js";
import logger from "./logger.js";

// In-memory fallback blacklist used when Redis is unavailable.
// Maps token hash → expiry timestamp (ms). Entries survive the outage
// window and are garbage-collected lazily on lookup.
const localBlacklist = new Map<string, number>();

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
 * Falls back to an in-memory Map if Redis is unavailable.
 * The entry will expire when the token itself would have expired.
 *
 * @param token - The token string to invalidate.
 * @param secret - The secret used to verify the token (to get its expiry).
 */
export const invalidateToken = async (token: string, secret: string) => {
  let decoded: JwtPayload;
  try {
    decoded = verifyToken(token, secret) as JwtPayload;
  } catch {
    // Token is already invalid/expired — nothing to blacklist.
    return;
  }

  if (!decoded.exp) return;

  const tokenHash = getTokenHash(token);
  const ttl = decoded.exp - Math.floor(Date.now() / 1000);

  if (ttl <= 0) return;

  // Always write to the in-memory fallback (fast, no I/O).
  localBlacklist.set(tokenHash, Date.now() + ttl * 1000);

  try {
    await redisClient.set(`blacklist:${tokenHash}`, "true", {
      EX: ttl,
    });
  } catch (err) {
    logger.warn({
      msg: "Redis unavailable for token invalidation — in-memory fallback active",
      err,
    });
  }
};

/**
 * Checks if a token is blacklisted.
 * Reads from Redis first, falls back to the in-memory Map.
 *
 * @param token - The token string to check.
 * @returns True if blacklisted, false otherwise.
 */
export const isTokenBlacklisted = async (token: string) => {
  const tokenHash = getTokenHash(token);

  // Try Redis first.
  try {
    const result = await redisClient.get(`blacklist:${tokenHash}`);
    return !!result;
  } catch {
    logger.warn({
      msg: "Redis unavailable for blacklist check — using in-memory fallback",
    });
  }

  // Fallback: check in-memory Map. Purge expired entries lazily.
  const expiry = localBlacklist.get(tokenHash);
  if (expiry === undefined) return false;

  if (Date.now() > expiry) {
    localBlacklist.delete(tokenHash);
    return false;
  }

  return true;
};
