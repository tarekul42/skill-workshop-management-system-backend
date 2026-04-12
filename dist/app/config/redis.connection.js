import envVariables from "./env.js";
const redisConnection = {
    host: envVariables.REDIS.REDIS_HOST,
    port: Number(envVariables.REDIS.REDIS_PORT),
    username: envVariables.REDIS.REDIS_USERNAME,
    password: envVariables.REDIS.REDIS_PASSWORD,
    maxRetriesPerRequest: null, // Critical for BullMQ
};
export default redisConnection;
