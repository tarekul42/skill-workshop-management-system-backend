import { ConnectionOptions } from "bullmq";
import envVariables from "./env";

const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST as string,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME || "",
  password: process.env.REDIS_PASSWORD || "",
  maxRetriesPerRequest: null, // Critical for BullMQ
};

export default redisConnection;
