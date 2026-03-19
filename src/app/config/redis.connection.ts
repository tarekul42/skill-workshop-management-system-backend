import { ConnectionOptions } from "bullmq";
import envVariables from "./env";

const redisConnection: ConnectionOptions = {
  host: envVariables.REDIS.REDIS_HOST,
  port: Number(envVariables.REDIS.REDIS_PORT),
  username: envVariables.REDIS.REDIS_USERNAME,
  password: envVariables.REDIS.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Critical for BullMQ
};

export default redisConnection;
