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

const userUpdateRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many update attempts from this IP, please try again later.",
  },
});

export { loginRateLimiter, userListRateLimiter, userUpdateRateLimiter };
