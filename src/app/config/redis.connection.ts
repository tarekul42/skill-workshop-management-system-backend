import { ConnectionOptions } from "bullmq";
import envVariables from "./env.js";

const isProduction = envVariables.NODE_ENV === "production";

const redisConnection: ConnectionOptions = {
  host: envVariables.REDIS.REDIS_HOST,
  port: Number(envVariables.REDIS.REDIS_PORT),
  ...(isProduction && { tls: { rejectUnauthorized: true } }),
  ...(envVariables.REDIS.REDIS_USERNAME && {
    username: envVariables.REDIS.REDIS_USERNAME,
  }),
  ...(envVariables.REDIS.REDIS_PASSWORD && {
    password: envVariables.REDIS.REDIS_PASSWORD,
  }),
  maxRetriesPerRequest: null, // Critical for BullMQ
};

export default redisConnection;
