import { describe, it, expect } from "bun:test";
import request from "supertest";
import app from "../src/app";
import { swaggerSpec as swaggerSpecUntyped } from "../src/app/config/swagger.config";
import envVariables from "../src/app/config/env";

const swaggerSpec = swaggerSpecUntyped as any;

describe("Environment", () => {
  it("should load PORT from .env (default 5000 for dev)", () => {
    expect(envVariables.PORT).toBeDefined();
    expect(envVariables.PORT).toMatch(/^\d+$/);
    const port = Number(envVariables.PORT);
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThanOrEqual(65535);
  });
});

describe("Root & Health Endpoints", () => {
  it("GET / should return 200 and the welcome message", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Welcome to the Skill Workshop Management System Backend!",
    });
  });

  it("GET /api/v1/health/ should return 200 and the module status message", async () => {
    const response = await request(app).get("/api/v1/health/");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Skill Workshop Management System Backend is up and running.",
    });
  });

  it("GET /ping should return 200 and pong", async () => {
    const response = await request(app).get("/api/v1/health/ping");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: "pong" });
  });

  it("GET /check-version should return 200 with version info", async () => {
    const response = await request(app).get("/api/v1/health/check-version");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("version", "1.0.0");
    expect(response.body).toHaveProperty("message", "Server is running.");
    expect(response.body).toHaveProperty("timestamp");
  });

  it("GET /health-check should return 200 with status and uptime", async () => {
    const response = await request(app).get("/api/v1/health/health-check");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("timestamp");
    expect(response.body).toHaveProperty("uptime");
  });

  it("GET /api-docs.json should return the OpenAPI spec", async () => {
    const response = await request(app).get("/api-docs.json");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("openapi", "3.0.0");
    expect(response.body).toHaveProperty("paths");
    expect(response.body.paths).toHaveProperty("/health/");
  });

  it("should be documented in swagger", () => {
    expect(swaggerSpec.paths).toHaveProperty("/health/");
    expect(swaggerSpec.paths["/health/"].get.summary).toBe("Root endpoint");
    expect(swaggerSpec.paths).toHaveProperty("/health/ping");
    expect(swaggerSpec.paths).toHaveProperty("/health/check-version");
    expect(swaggerSpec.paths).toHaveProperty("/health/health-check");

    expect(swaggerSpec.paths).toHaveProperty("/auth/login");
    expect(swaggerSpec.paths["/auth/login"].post.tags).toContain("Auth");

    expect(swaggerSpec.paths).toHaveProperty("/auth/refresh-token");
    expect(swaggerSpec.paths).toHaveProperty("/auth/logout");

    // User Routes
    expect(swaggerSpec.paths).toHaveProperty("/user/register");
    expect(swaggerSpec.paths["/user/register"].post.tags).toContain("User");
    expect(swaggerSpec.paths).toHaveProperty("/user/me");
    expect(swaggerSpec.paths).toHaveProperty("/user/all-users");

    // Category Routes
    expect(swaggerSpec.paths).toHaveProperty("/category/create");
    expect(swaggerSpec.paths["/category/create"].post.tags).toContain(
      "Category",
    );
    expect(swaggerSpec.paths).toHaveProperty("/category");
    expect(swaggerSpec.paths).toHaveProperty("/category/{slug}");

    // Workshop Routes
    expect(swaggerSpec.paths).toHaveProperty("/workshop/levels");
    expect(swaggerSpec.paths["/workshop/levels"].get.tags).toContain("Level");
    expect(swaggerSpec.paths).toHaveProperty("/workshop/create");
    expect(swaggerSpec.paths["/workshop/create"].post.tags).toContain(
      "Workshop",
    );
    expect(swaggerSpec.paths).toHaveProperty("/workshop");
    expect(swaggerSpec.paths).toHaveProperty("/workshop/{slug}");

    // Enrollment Routes
    expect(swaggerSpec.paths).toHaveProperty("/enrollment");
    expect(swaggerSpec.paths["/enrollment"].post.tags).toContain("Enrollment");
    expect(swaggerSpec.paths).toHaveProperty("/enrollment/my-enrollments");
    expect(swaggerSpec.paths).toHaveProperty("/enrollment/{enrollmentId}");
    expect(swaggerSpec.paths).toHaveProperty("/enrollment/{enrollmentId}/status");

    // Payment Routes
    expect(swaggerSpec.paths).toHaveProperty("/payment/init-payment/{enrollmentId}");
    expect(swaggerSpec.paths["/payment/init-payment/{enrollmentId}"].post.tags).toContain("Payment");
    expect(swaggerSpec.paths).toHaveProperty("/payment/success");
    expect(swaggerSpec.paths).toHaveProperty("/payment/fail");
    expect(swaggerSpec.paths).toHaveProperty("/payment/cancel");
    expect(swaggerSpec.paths).toHaveProperty("/payment/invoice/{paymentId}");
    expect(swaggerSpec.paths["/payment/invoice/{paymentId}"].get.tags).toContain("Payment");
    expect(swaggerSpec.paths).toHaveProperty("/payment/validate-payment");
    expect(swaggerSpec.paths["/payment/validate-payment"].post.tags).toContain("Payment");

    // OTP Routes
    expect(swaggerSpec.paths).toHaveProperty("/otp/send");
    expect(swaggerSpec.paths["/otp/send"].post.tags).toContain("OTP");
    expect(swaggerSpec.paths).toHaveProperty("/otp/verify");
    expect(swaggerSpec.paths["/otp/verify"].post.tags).toContain("OTP");

    // Stats Routes
    expect(swaggerSpec.paths).toHaveProperty("/stats/enrollment");
    expect(swaggerSpec.paths["/stats/enrollment"].get.tags).toContain("Stats");
    expect(swaggerSpec.paths).toHaveProperty("/stats/payment");
    expect(swaggerSpec.paths).toHaveProperty("/stats/users");
    expect(swaggerSpec.paths).toHaveProperty("/stats/workshops");
  });
});

describe("Payment Routes - Swagger Documentation", () => {
  it("should have init-payment endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/payment/init-payment/{enrollmentId}"];
    expect(path.post.security).toBeDefined();
    expect(path.post.parameters).toBeDefined();
  });

  it("should have success endpoint documented", () => {
    const path = swaggerSpec.paths["/payment/success"];
    expect(path.post.summary).toBe("Payment success callback");
  });

  it("should have fail endpoint documented", () => {
    const path = swaggerSpec.paths["/payment/fail"];
    expect(path.post.summary).toBe("Payment fail callback");
  });

  it("should have cancel endpoint documented", () => {
    const path = swaggerSpec.paths["/payment/cancel"];
    expect(path.post.summary).toBe("Payment cancel callback");
  });

  it("should have invoice endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/payment/invoice/{paymentId}"];
    expect(path.get.security).toBeDefined();
    expect(path.get.parameters).toBeDefined();
  });

  it("should have validate-payment endpoint documented with auth and request body", () => {
    const path = swaggerSpec.paths["/payment/validate-payment"];
    expect(path.post.security).toBeDefined();
    expect(path.post.requestBody).toBeDefined();
    expect(path.post.requestBody.content["application/json"].schema.required).toContain("val_id");
  });
});

describe("OTP Routes - Swagger Documentation", () => {
  it("should have otp/send endpoint documented", () => {
    const path = swaggerSpec.paths["/otp/send"];
    expect(path.post.tags).toContain("OTP");
    expect(path.post.summary).toBe("Send OTP to user email or phone");
  });

  it("should have otp/verify endpoint documented with request body", () => {
    const path = swaggerSpec.paths["/otp/verify"];
    expect(path.post.tags).toContain("OTP");
    expect(path.post.summary).toBe("Verify OTP");
    expect(path.post.requestBody).toBeDefined();
  });
});

describe("Stats Routes - Swagger Documentation", () => {
  it("should have stats/enrollment endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/stats/enrollment"];
    expect(path.get.tags).toContain("Stats");
    expect(path.get.security).toBeDefined();
  });

  it("should have stats/payment endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/stats/payment"];
    expect(path.get.tags).toContain("Stats");
    expect(path.get.security).toBeDefined();
  });

  it("should have stats/users endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/stats/users"];
    expect(path.get.tags).toContain("Stats");
    expect(path.get.security).toBeDefined();
  });

  it("should have stats/workshops endpoint documented with auth", () => {
    const path = swaggerSpec.paths["/stats/workshops"];
    expect(path.get.tags).toContain("Stats");
    expect(path.get.security).toBeDefined();
  });
});
