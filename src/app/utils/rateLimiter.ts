import { rateLimit } from "express-rate-limit";

const generalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: "Too many attempts, please try again later.",
  },
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message:
      "Too many attempts on this sensitive operation, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminCrudLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export { generalLimiter, authLimiter, strictLimiter, adminCrudLimiter };
