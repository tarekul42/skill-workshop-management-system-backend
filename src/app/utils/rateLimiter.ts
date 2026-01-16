import { rateLimit } from "express-rate-limit";

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const userListRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

export { loginRateLimiter, userListRateLimiter };
