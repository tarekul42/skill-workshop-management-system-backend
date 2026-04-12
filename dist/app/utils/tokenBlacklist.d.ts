/**
 * Invalidates a token by adding its hash to a blacklist in Redis.
 * The entry in Redis will expire when the token itself would have expired.
 *
 * @param token - The token string to invalidate.
 * @param secret - The secret used to verify the token (to get its expiry).
 */
export declare const invalidateToken: (token: string, secret: string) => Promise<void>;
/**
 * Checks if a token is blacklisted.
 *
 * @param token - The token string to check.
 * @returns True if blacklisted, false otherwise.
 */
export declare const isTokenBlacklisted: (token: string) => Promise<boolean>;
