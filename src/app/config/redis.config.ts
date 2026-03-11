import { createClient } from "redis";
import envVariables from "./env";
import logger from "../utils/logger";

const redisOptions: Parameters<typeof createClient>[0] = {
  socket: {
    host: envVariables.REDIS.REDIS_HOST,
    port: Number(envVariables.REDIS.REDIS_PORT),
  },
};
if (envVariables.REDIS.REDIS_USERNAME) {
  redisOptions.username = envVariables.REDIS.REDIS_USERNAME;
}
if (envVariables.REDIS.REDIS_PASSWORD) {
  redisOptions.password = envVariables.REDIS.REDIS_PASSWORD;
}

const redisClient = createClient(redisOptions);

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
