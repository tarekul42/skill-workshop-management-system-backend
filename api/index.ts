import type { VercelRequest, VercelResponse } from "@vercel/node";
import mongoose from "mongoose";
import app from "../src/app.js";
import envVariables from "../src/app/config/env.js";
import { connectRedis, redisClient } from "../src/app/config/redis.config.js";
import logger from "../src/app/utils/logger.js";

let isDbConnected = false;
let isRedisConnected = false;

/**
 * Ensures MongoDB and Redis are connected globally for serverless environments.
 * Vercel drops TCP connections when the instance suspends, causing buffering timeouts.
 */
async function prepareServerlessConnections() {
  try {
    // 1. Establish MongoDB Connection
    if (!isDbConnected || mongoose.connection.readyState !== 1) {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
      
      logger.info({ msg: "[Serverless] Connecting to MongoDB Atlas..." });
      await mongoose.connect(envVariables.DATABASE_URL, {
        serverSelectionTimeoutMS: 8000, // Fail fast to prevent Vercel 10s execution timeout
        socketTimeoutMS: 45000,
      });
      isDbConnected = true;
      logger.info({ msg: "[Serverless] MongoDB Connected" });
    }

    // 2. Establish Redis Connection
    if (!isRedisConnected || !redisClient.isOpen) {
      logger.info({ msg: "[Serverless] Connecting to Redis..." });
      await connectRedis();
      isRedisConnected = true;
      logger.info({ msg: "[Serverless] Redis Connected" });
    }
  } catch (error) {
    logger.error({ msg: "[Serverless] Connection Error", err: error });
    // Don't crash the serverless function, let Express handle/return 500s where needed
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  await prepareServerlessConnections();
  
  // Delegate the fully prepared request to Express
  return app(req as any, res as any);
}
