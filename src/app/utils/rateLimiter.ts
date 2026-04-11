import type { NextFunction, Request, Response } from "express";
import { ipKeyGenerator, rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.config";

import envVariables from "../config/env";

const createLimiter = (
  prefix: string,
  windowMs: number,
  max: number,
  message: object,
  skipHealth = true,
) => {
  if (envVariables.NODE_ENV === "test") {
    return (req: Request, res: Response, next: NextFunction) => next();
  }

  return rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => `${ipKeyGenerator(req.ip || "")}:${req.path}`,
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        try {
          if (redisClient.isOpen) {
            return await redisClient.sendCommand(args);
          }
        } catch {
          // Log is skipped to avoid noise, passOnStoreError handles it
        }

        // Return neutral values for library initialization/execution
        if (args[0] === "SCRIPT" && args[1] === "LOAD") {
          return "0000000000000000000000000000000000000000";
        }
        return 0;
      },
      prefix,
    }),
    windowMs,
    max,
    message,
    skip: (req) => skipHealth && req.originalUrl.includes("/health"),
    passOnStoreError: true,
  });
};

// Rate limiters for production
const generalLimiter = createLimiter("rl:general:", 1 * 60 * 1000, 100, {
  status: 429,
  message: "Too many requests, please try again later.",
});

const healthLimiter = createLimiter(
  "rl:health:",
  1 * 60 * 1000,
  20,
  {
    status: 429,
    message: "Too many health check requests, please try again later.",
  },
  false,
);

const authLimiter = createLimiter("rl:auth:", 15 * 60 * 1000, 15, {
  status: 429,
  message: "Too many attempts, please try again later.",
});

const strictLimiter = createLimiter("rl:strict:", 15 * 60 * 1000, 10, {
  status: 429,
  message:
    "Too many attempts on this sensitive operation, please try again later.",
});

const adminCrudLimiter = createLimiter("rl:admin:", 15 * 60 * 1000, 100, {
  status: 429,
  message: "Too many requests, please try again later.",
});

export {
  adminCrudLimiter,
  authLimiter,
  generalLimiter,
  healthLimiter,
  strictLimiter,
};
