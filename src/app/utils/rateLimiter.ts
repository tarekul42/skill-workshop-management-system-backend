import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.config";

const commonOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
};

const generalLimiter = rateLimit({
  ...commonOptions,
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

const authLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    status: 429,
    message: "Too many attempts, please try again later.",
  },
});

const strictLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    message:
      "Too many attempts on this sensitive operation, please try again later.",
  },
});

const adminCrudLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
});

export { adminCrudLimiter, authLimiter, generalLimiter, strictLimiter };
