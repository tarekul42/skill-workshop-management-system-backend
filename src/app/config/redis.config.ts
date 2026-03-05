import { createClient } from "redis";
import envVariables from "./env";
import logger from "../utils/logger";

const redisClient = createClient({
  username: envVariables.REDIS.REDIS_USERNAME,
  password: envVariables.REDIS.REDIS_PASSWORD,
  socket: {
    host: envVariables.REDIS.REDIS_HOST,
    port: Number(envVariables.REDIS.REDIS_PORT),
  },
});

redisClient.on("error", (err) =>
  logger.error({ message: "Redis Client Error", err }),
);

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info({ message: "Redis Connected" });
  }
};

export { connectRedis, redisClient };
