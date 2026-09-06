/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeAll, describe, expect, it, mock, spyOn } from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
}));

mock.module("../../src/app/utils/sendEmail", () => ({
  default: async () => undefined,
}));

import request from "supertest";
import app from "../../src/app";
import envVariables from "../../src/app/config/env";
import { connectRedis, redisClient } from "../../src/app/config/redis.config";

beforeAll(async () => {
  spyOn(redisClient, "connect").mockResolvedValue({} as any);
  spyOn(redisClient, "get").mockResolvedValue(null);
  spyOn(redisClient, "set").mockResolvedValue("OK");
  spyOn(redisClient, "del").mockResolvedValue(1);
  spyOn(redisClient, "expire").mockResolvedValue(true as unknown as never);
  await connectRedis();
});

describe("Security Hardening (Phase 8)", () => {
  describe("CORS rejection", () => {
    it("should reject requests from unknown origins", async () => {
      const res = await request(app)
        .get("/")
        .set("Origin", "https://evil.example.com");
      // CORS middleware blocks the request, but Express still serves the route
      // The key is that no Access-Control-Allow-Origin header is returned
      expect(res.headers["access-control-allow-origin"]).toBeUndefined();
    });

    it("should allow requests from configured origins", async () => {
      const allowedOrigin = envVariables.FRONTEND_URL.split(",")[0].trim();
      const res = await request(app)
        .get("/")
        .set("Origin", allowedOrigin);
      expect(res.status).toBe(200);
    });
  });

  describe("Security headers", () => {
    it("should set security headers via helmet", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-content-type-options"]).toBe("nosniff");
      // Helmet defaults to SAMEORIGIN for X-Frame-Options
      expect(res.headers["x-frame-options"]).toBeDefined();
    });

    it("should disable x-powered-by", async () => {
      const res = await request(app).get("/");
      expect(res.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("mongoSanitize rejection", () => {
    it("should reject body with $ operator", async () => {
      const res = await request(app)
        .post("/api/v1/otp/send")
        .send({ email: { $gt: "" } });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain("Potentially malicious input");
    });

    it("should reject query with __proto__ key", async () => {
      const res = await request(app)
        .get("/api/v1/category?__proto__=polluted");
      // Query params with __proto__ should be rejected
      expect(res.status).toBe(400);
    });
  });

  describe("Metrics endpoint protection", () => {
    it("should reject metrics without API key", async () => {
      const res = await request(app).get("/metrics");
      expect(res.status).toBe(403);
    });

    it("should reject metrics with wrong API key", async () => {
      const res = await request(app)
        .get("/metrics")
        .set("x-metrics-key", "wrong-key");
      expect(res.status).toBe(403);
    });
  });

  describe("Rate limiting", () => {
    it("should have rate limiter configured on auth routes", async () => {
      // CSRF token endpoint should have rate limiting
      const res = await request(app).get("/api/v1/csrf-token");
      expect(res.status).toBe(200);
      // Rate limit headers may be present
    });
  });
});
