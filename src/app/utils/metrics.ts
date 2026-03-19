import mongoose from "mongoose";
import client from "prom-client";
import { redisClient } from "../config/redis.config";
import { mailQueue } from "../jobs/mail.queue";

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "skill-workshop-backend",
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create a custom histogram for HTTP request duration
export const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10], // Buckets for response time from 0.1s to 10s
});

// Redis memory usage in bytes
const redisUsedMemoryBytes = new client.Gauge({
  name: "redis_used_memory_bytes",
  help: "Redis used memory in bytes",
});

// Database connection latency in milliseconds
const dbConnectionLatencyMs = new client.Gauge({
  name: "db_connection_latency_ms",
  help: "Database connection latency in milliseconds",
});

// Queue length (total jobs across states)
const mailQueueJobsTotal = new client.Gauge({
  name: "mail_queue_jobs_total",
  help: "Total number of jobs in the mail queue (waiting, active, delayed, failed)",
});

// Register the custom metrics
register.registerMetric(httpRequestDurationMicroseconds);
register.registerMetric(redisUsedMemoryBytes);
register.registerMetric(dbConnectionLatencyMs);
register.registerMetric(mailQueueJobsTotal);

export const updateSystemMetrics = async (): Promise<void> => {
  // Redis memory
  try {
    if (redisClient.isOpen) {
      const info = await redisClient.info("memory");
      const match = info.match(/used_memory:(\d+)/);
      if (match) {
        const usedMemory = Number(match[1]);
        if (!Number.isNaN(usedMemory)) {
          redisUsedMemoryBytes.set(usedMemory);
        }
      }
    }
  } catch {
    // If Redis is unavailable, we simply skip updating this metric
  }

  // DB latency
  try {
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const start = process.hrtime();
      await mongoose.connection.db.admin().ping();
      const diff = process.hrtime(start);
      const latencyMs = diff[0] * 1000 + diff[1] / 1e6;
      dbConnectionLatencyMs.set(latencyMs);
    }
  } catch {
    // Skip updating DB latency on error
  }

  // Queue length
  try {
    const [waiting, active, delayed, failed] = await Promise.all([
      mailQueue.getWaitingCount(),
      mailQueue.getActiveCount(),
      mailQueue.getDelayedCount(),
      mailQueue.getFailedCount(),
    ]);

    const total =
      (waiting ?? 0) + (active ?? 0) + (delayed ?? 0) + (failed ?? 0);
    mailQueueJobsTotal.set(total);
  } catch {
    // Skip updating queue metric on error
  }
};

export { register };
