import { Queue } from "bullmq";
import redisConnection from "../config/redis.connection";

export const MAIL_QUEUE = "mailQueue";

export const mailQueue = new Queue(MAIL_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
