import client from "prom-client";

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

// Register the custom metric
register.registerMetric(httpRequestDurationMicroseconds);

export { register };
