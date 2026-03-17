import { rateLimit } from "express-rate-limit";
import type { NextFunction, Request, Response } from "express";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.config";

import envVariables from "../config/env";

const createLimiter = (
  prefix: string,
  windowMs: number,
  max: number,
  message: object,
) => {
  if (envVariables.NODE_ENV === "test") {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        if (!redisClient.isOpen) {
          await redisClient.connect();
        }
        return redisClient.sendCommand(args);
      },
      prefix,
    }),
    windowMs,
    max,
    message,
    skip: (req) => req.originalUrl.includes("/health"),
  });
};

// Rate limiters for production
const generalLimiter = createLimiter("rl:general:", 1 * 60 * 1000, 60, {
  status: 429,
  message: "Too many requests, please try again later.",
});

const authLimiter = createLimiter("rl:auth:", 15 * 60 * 1000, 10, {
  status: 429,
  message: "Too many attempts, please try again later.",
});

const strictLimiter = createLimiter("rl:strict:", 15 * 60 * 1000, 5, {
  status: 429,
  message:
    "Too many attempts on this sensitive operation, please try again later.",
});

const adminCrudLimiter = createLimiter("rl:admin:", 15 * 60 * 1000, 30, {
  status: 429,
  message: "Too many requests, please try again later.",
});

export { adminCrudLimiter, authLimiter, generalLimiter, strictLimiter };
