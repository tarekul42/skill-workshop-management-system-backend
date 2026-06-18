/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  mock,
  spyOn,
} from "bun:test";

mock.module("../../src/app/config/csrf.config", () => ({
  doubleCsrfProtection: (req: any, res: any, next: any) => next(),
  generateCsrfToken: () => "mocked-csrf-token",
}));

import mongoose from "mongoose";
import request from "supertest";
import app from "../../src/app";
import envVariables from "../../src/app/config/env";
import { connectRedis, redisClient } from "../../src/app/config/redis.config";
import User from "../../src/app/modules/user/user.model";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { generateToken } from "../../src/app/utils/jwt";
import { IsActive, UserRole } from "../../src/app/modules/user/user.interface";

describe("Auth Flow", () => {
  let mongoServer: MongoMemoryReplSet;
  let agent: any;
  let userId: string;
  let accessToken: string;

  beforeAll(async () => {
    agent = request.agent(app);
    mongoServer = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);

    spyOn(redisClient, "connect").mockResolvedValue({} as any);
    spyOn(redisClient, "get").mockResolvedValue(null);
    spyOn(redisClient, "set").mockResolvedValue("OK");
    await connectRedis();

    if (mongoose.connection.db) {
      await mongoose.connection.db.dropDatabase();
    }

    const student = await User.create({
      name: "Test Student",
      email: "student@auth.test",
      password: "Password123!",
      role: UserRole.STUDENT,
      isVerified: true,
      isActive: IsActive.ACTIVE,
    });
    userId = student._id.toString();

    accessToken = generateToken(
      { userId, email: student.email, role: student.role },
      envVariables.JWT_ACCESS_SECRET,
      envVariables.JWT_ACCESS_EXPIRES,
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe("POST /auth/login", () => {
    it("should return validation error for missing email", async () => {
      const res = await agent.post("/api/v1/auth/login").send({
        password: "Password123!",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return validation error for missing password", async () => {
      const res = await agent.post("/api/v1/auth/login").send({
        email: "student@auth.test",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should return validation error for invalid email format", async () => {
      const res = await agent.post("/api/v1/auth/login").send({
        email: "not-an-email",
        password: "Password123!",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("POST /auth/register (via /user/register)", () => {
    it("should register a new user successfully", async () => {
      const res = await agent.post("/api/v1/user/register").send({
        name: "New User",
        email: "newuser@auth.test",
        password: "StrongPass1!",
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.email).toBe("newuser@auth.test");
    });

    it("should reject duplicate email registration", async () => {
      const res = await agent.post("/api/v1/user/register").send({
        name: "Duplicate",
        email: "newuser@auth.test",
        password: "StrongPass1!",
      });
      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject registration with weak password", async () => {
      const res = await agent.post("/api/v1/user/register").send({
        name: "Weak Password User",
        email: "weak@auth.test",
        password: "123",
      });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe("GET /user/me", () => {
    it("should return current user profile with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/user/me")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe("student@auth.test");
    });

    it("should reject request without token", async () => {
      const res = await request(app).get("/api/v1/user/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /auth/refresh-token", () => {
    it("should return error without refresh token cookie", async () => {
      const res = await agent.post("/api/v1/auth/refresh-token");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});
